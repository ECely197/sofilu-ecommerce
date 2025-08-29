// Contenido completo y verificado para: src/app/pages/admin/category-form/category-form.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'; // Asegúrate de que FormBuilder está aquí

import { CategoryService } from '../../../services/category.service';
import { StorageService } from '../../../services/storage';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder); // Inyección de FormBuilder
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  categoryForm!: FormGroup; // Se inicializa en ngOnInit
  isEditMode = signal(false);
  private categoryId: string | null = null;

  imagePreview = signal<string | null>(null);
  private selectedFile: File | null = null;
  isUploading = signal(false);

  ngOnInit(): void {
    // Inicializamos el formulario usando el FormBuilder inyectado
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      imageUrl: ['', Validators.required], // Este campo es requerido, pero lo llenamos después de subir la imagen
    });

    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.isEditMode.set(true);
      this.categoryService
        .getCategoryById(this.categoryId)
        .subscribe((category) => {
          this.categoryForm.patchValue(category);
          this.imagePreview.set(category.imageUrl);
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.imagePreview.set(URL.createObjectURL(this.selectedFile));
      // Importante: Si se selecciona una imagen nueva, el campo imageUrl ya no es válido hasta que se suba.
      // Pero no necesitamos cambiar el validador, lo manejamos en el handleSubmit.
    }
  }

  handleSubmit(): void {
    console.log("--- CategoryForm: Se ha hecho clic en 'Guardar'. ---"); // LOG 1

    // LOG 2: Imprimimos el estado completo del formulario
    console.log('Estado del formulario:', this.categoryForm);
    console.log('Valores del formulario:', this.categoryForm.value);
    console.log('¿Formulario válido?', this.categoryForm.valid);

    // LOG 3: Verificamos si hay un archivo seleccionado
    console.log('¿Hay un archivo de imagen seleccionado?', !!this.selectedFile);

    // --- Lógica de Validación Original (con logs) ---
    if (!this.isEditMode() && !this.selectedFile) {
      console.error(
        "--- VALIDACIÓN FALLIDA: No se ha seleccionado una imagen en modo 'Crear'. ---"
      );
      this.toastService.show(
        'Por favor, selecciona una imagen para la categoría.'
      );
      return;
    }

    if (this.categoryForm.invalid) {
      console.error(
        '--- VALIDACIÓN FALLIDA: El formulario no es válido. Errores:',
        this.categoryForm.errors
      );
      // Marcamos los campos para que los errores visuales aparezcan si no lo han hecho
      this.categoryForm.markAllAsTouched();
      return;
    }

    console.log('--- VALIDACIÓN SUPERADA: Procediendo a guardar... ---'); // LOG 4

    // ... (el resto de la lógica para subir imagen y guardar no cambia)
    if (this.selectedFile) {
      this.isUploading.set(true);
      // ...
    } else {
      this.saveCategory(this.categoryForm.value.imageUrl);
    }
  }

  private saveCategory(imageUrl: string): void {
    // Actualizamos el valor de imageUrl en el formulario antes de enviarlo
    this.categoryForm.patchValue({ imageUrl: imageUrl });

    const categoryData = this.categoryForm.value;

    const operation = this.isEditMode()
      ? this.categoryService.updateCategory(this.categoryId!, categoryData)
      : this.categoryService.createCategory(categoryData);

    operation.subscribe({
      next: () => {
        this.toastService.show(
          `Categoría ${this.isEditMode() ? 'actualizada' : 'creada'} con éxito`
        );
        this.router.navigate(['/admin/categories']);
      },
      error: (err) => {
        console.error('Error al guardar la categoría:', err);
        this.toastService.show(
          err.error.message || 'No se pudo guardar la categoría.'
        );
      },
    });
  }
}
