import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';

import { ProductServices } from '../../../services/product';
import { StorageService } from '../../../services/storage'; // Corregido de 'storage'
import { CategoryService, Category } from '../../../services/category.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);
  private storageService = inject(StorageService);
  private categoryService = inject(CategoryService);

  productForm!: FormGroup;
  isEditMode = signal(false);
  private productId: string | null = null;

  categories = signal<Category[]>([]);
  imagePreviews = signal<string[]>([]);
  private selectedFiles: File[] = [];
  isUploading = signal(false);

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]],
      category: [null, Validators.required],
      images: this.fb.array([], [Validators.minLength(1)]), // Solo validamos que no esté vacío
      isFeatured: [false],
      isOnSale: [false],
      salePrice: [null],
      variants: this.fb.array([]),
    });

    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      this.productService
        .getProductById(this.productId)
        .subscribe((product) => {
          this.productForm.patchValue(product);
          this.images.clear();
          product.images.forEach((imgUrl) =>
            this.images.push(this.fb.control(imgUrl))
          );
          this.imagePreviews.set([...product.images]);
          this.variants.clear();
          product.variants.forEach((variant) => {
            const optionsArray = this.fb.array(
              variant.options.map((opt) => this.fb.group({ name: opt.name }))
            );
            this.variants.push(
              this.fb.group({ name: variant.name, options: optionsArray })
            );
          });
        });
    }
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }
  get images() {
    return this.productForm.get('images') as FormArray;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      const previewUrls = this.selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      this.imagePreviews.set(previewUrls);
      // Truco: Para pasar la validación, llenamos el FormArray con valores temporales.
      // Estos serán reemplazados por las URLs reales después de la subida.
      this.images.clear();
      this.selectedFiles.forEach((file) =>
        this.images.push(this.fb.control(file.name))
      );
    }
  }

  // --- MÉTODOS PARA VARIANTES ---
  newVariant(name: string = ''): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      options: this.fb.array([this.newOption()]),
    });
  }
  addVariant(): void {
    this.variants.push(this.newVariant());
  }
  removeVariant(variantIndex: number): void {
    this.variants.removeAt(variantIndex);
  }
  variantOptions(variantIndex: number): FormArray {
    return this.variants.at(variantIndex).get('options') as FormArray;
  }
  newOption(name: string = ''): FormGroup {
    return this.fb.group({ name: [name, Validators.required] });
  }
  addVariantOption(variantIndex: number): void {
    this.variantOptions(variantIndex).push(this.newOption());
  }
  removeVariantOption(variantIndex: number, optionIndex: number): void {
    this.variantOptions(variantIndex).removeAt(optionIndex);
  }

  // --- MÉTODO PRINCIPAL DE GUARDADO ---
  handleSubmit() {
    console.log("--- FRONTEND TRACE [1/5]: Clic en 'Guardar'. ---");
    console.log(
      'Estado del formulario:',
      this.productForm.valid ? 'Válido' : 'Inválido'
    );
    console.log(
      'Valores crudos del formulario:',
      this.productForm.getRawValue()
    );
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      console.error(
        '--- FRONTEND TRACE: El formulario es inválido. Deteniendo. ---'
      );
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isUploading.set(true);
    console.log(
      `--- FRONTEND TRACE [2/5]: Hay ${this.selectedFiles.length} nuevos archivos para subir. ---`
    );

    const uploadOperations =
      this.selectedFiles.length > 0
        ? this.selectedFiles.map((file) =>
            this.storageService.uploadImage(file)
          )
        : of(this.images.value); // Si no hay archivos nuevos, usamos las URLs existentes

    forkJoin(uploadOperations).subscribe({
      next: (downloadURLs) => {
        console.log(
          '--- FRONTEND TRACE [3/5]: Imágenes procesadas. URLs finales:',
          downloadURLs
        );
        this.images.clear();
        downloadURLs.forEach((url) => this.images.push(this.fb.control(url)));
        this.saveProductData();
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error(
          '--- FRONTEND TRACE: ERROR al subir una o más imágenes:',
          err
        );
        alert('No se pudieron subir las imágenes.');
      },
    });
  }

  private saveProductData(): void {
    console.log('--- FRONTEND TRACE [4/5]: Entrando a saveProductData. ---');
    const productData = this.productForm.getRawValue();
    console.log(
      '--- FRONTEND TRACE [5/5]: Objeto final que se enviará al backend: ---'
    );
    console.log(JSON.stringify(productData, null, 2));

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId!, productData)
      : this.productService.createProduct(productData);

    operation.subscribe({
      next: (response) => {
        this.isUploading.set(false);
        console.log(
          '--- FRONTEND TRACE: ¡ÉXITO! Respuesta del backend:',
          response
        );
        alert(
          `Producto ${this.isEditMode() ? 'actualizado' : 'creado'} con éxito`
        );
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error(
          '--- FRONTEND TRACE: ¡ERROR! El backend respondió con un error:',
          err
        );
        alert(err.error.message || 'No se pudo guardar el producto.');
      },
    });
  }
}
