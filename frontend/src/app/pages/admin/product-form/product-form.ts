// Contenido completo y final para: frontend/src/app/pages/admin/product-form/product-form.ts

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
import { StorageService } from '../../../services/storage';
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
      price: [null, [Validators.min(0)]],
      category: [null, Validators.required],
      images: this.fb.array([], [Validators.minLength(1)]),
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
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            category: (product.category as Category)?._id || product.category,
            isFeatured: product.isFeatured,
            isOnSale: product.isOnSale,
            salePrice: product.salePrice,
          });

          this.images.clear();
          product.images.forEach((imgUrl) =>
            this.images.push(this.fb.control(imgUrl))
          );
          this.imagePreviews.set([...product.images]);

          this.variants.clear();
          product.variants.forEach((variant) => {
            const optionsArray = this.fb.array(
              (variant.options as any[]).map((opt) =>
                this.newOption(opt.name, opt.priceModifier, opt.stock)
              )
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
      this.images.clear();
      this.selectedFiles.forEach((file) =>
        this.images.push(this.fb.control(file.name, Validators.required))
      );
    }
  }

  handleSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isUploading.set(true);

    // --- LÓGICA DE SUBIDA DE IMÁGENES CORREGIDA ---
    const uploadOperations$ =
      this.selectedFiles.length > 0
        ? forkJoin(
            this.selectedFiles.map((file) =>
              this.storageService.uploadImage(file)
            )
          )
        : of(this.images.value); // Si no hay archivos nuevos, usamos las URLs existentes en el formulario

    forkJoin(uploadOperations$).subscribe({
      // --- ¡CAMBIO AQUÍ! Añadimos el tipo (string | unknown)[] ---
      next: (downloadURLs: (string | unknown)[]) => {
        this.images.clear();
        // Le decimos a TypeScript que 'url' es de tipo string
        downloadURLs.forEach((url: any) =>
          this.images.push(this.fb.control(url))
        );
        this.saveProductData();
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error al subir las imágenes:', err);
        alert('No se pudieron subir las imágenes.');
      },
    });
  }

  private saveProductData(): void {
    const productData = this.productForm.getRawValue();

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId!, productData)
      : this.productService.createProduct(productData);

    operation.subscribe({
      next: () => {
        this.isUploading.set(false);
        alert(
          `Producto ${this.isEditMode() ? 'actualizado' : 'creado'} con éxito`
        );
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error al guardar el producto:', err);
        alert(err.error.message || 'No se pudo guardar el producto.');
      },
    });
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
  newOption(
    name: string = '',
    priceModifier: number = 0,
    stock: number = 0
  ): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      priceModifier: [priceModifier, [Validators.required, Validators.min(0)]],
      stock: [stock, [Validators.required, Validators.min(0)]],
    });
  }
  addVariantOption(variantIndex: number): void {
    this.variantOptions(variantIndex).push(this.newOption());
  }
  removeVariantOption(variantIndex: number, optionIndex: number): void {
    this.variantOptions(variantIndex).removeAt(optionIndex);
  }
}
