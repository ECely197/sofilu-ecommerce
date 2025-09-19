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
import { SectionService, Section } from '../../../services/section.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);
  private sectionService = inject(SectionService);

  categoryForm!: FormGroup; // Se inicializa en ngOnInit
  isEditMode = signal(false);
  private categoryId: string | null = null;
  sections = signal<Section[]>([]);

  imagePreview = signal<string | null>(null);
  private selectedFile: File | null = null;
  isUploading = signal(false);

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      imageUrl: [''],
      section: [null, Validators.required],
    });

    this.sectionService
      .getSections()
      .subscribe((data) => this.sections.set(data));

    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.isEditMode.set(true);
      this.categoryService
        .getCategoryById(this.categoryId)
        .subscribe((category) => {
          this.categoryForm.patchValue({
            name: category.name,
            imageUrl: category.imageUrl,
            section:
              typeof category.section === 'string'
                ? category.section
                : (category.section as Section)?._id,
          });
          this.imagePreview.set(category.imageUrl);
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.imagePreview.set(URL.createObjectURL(this.selectedFile));
    }
  }

  handleSubmit(): void {
    console.log('--- CategoryForm: handleSubmit disparado. ---');

    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.get('name')?.invalid) {
      this.toastService.show(
        'Por favor, introduce un nombre para la categoría.',
        'error'
      );
      return;
    }

    const hasExistingImage =
      this.isEditMode() && this.categoryForm.value.imageUrl;
    const hasNewFile = !!this.selectedFile;

    if (!hasExistingImage && !hasNewFile) {
      this.toastService.show(
        'Por favor, selecciona una imagen para la categoría.',
        'error'
      );
      return;
    }

    if (this.categoryForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }

    console.log('--- VALIDACIÓN SUPERADA ---');

    if (this.selectedFile) {
      this.isUploading.set(true);
      this.storageService.uploadImage(this.selectedFile).subscribe({
        next: (downloadURL) => {
          this.saveCategory(downloadURL); // Guardamos con la nueva URL
        },
        error: (err) => {
          this.isUploading.set(false);
          this.toastService.show('Error al subir la imagen.', 'error');
          console.error('Error de subida:', err);
        },
      });
    } else {
      this.saveCategory(this.categoryForm.value.imageUrl);
    }
  }

  private saveCategory(imageUrl: string): void {
    this.categoryForm.patchValue({ imageUrl: imageUrl });
    const categoryData = this.categoryForm.value;

    const operation = this.isEditMode()
      ? this.categoryService.updateCategory(this.categoryId!, categoryData)
      : this.categoryService.createCategory(categoryData);

    operation.subscribe({
      next: () => {
        this.toastService.show(
          `Categoría ${this.isEditMode() ? 'actualizada' : 'creada'} con éxito`,
          'success'
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
