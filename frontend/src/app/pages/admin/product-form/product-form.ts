// Contenido completo y corregido para: frontend/src/app/pages/admin/product-form/product-form.ts

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
import { ToastService } from '../../../services/toast.service';
import { Product } from '../../../interfaces/product.interface';

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
  private toastService = inject(ToastService);

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
      price: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]], // Campo de costo principal
      category: [null, Validators.required],
      images: this.fb.array([]),
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
          const categoryId =
            typeof product.category === 'string'
              ? product.category
              : (product.category as Category)?._id;

          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            costPrice: product.costPrice, // Cargar el costo
            category: categoryId,
            isFeatured: product.isFeatured,
            isOnSale: product.isOnSale,
            salePrice: product.salePrice,
          });

          product.images.forEach((imgUrl) =>
            this.images.push(this.fb.control(imgUrl))
          );
          this.imagePreviews.set([...product.images]);

          product.variants.forEach((variant) => {
            const optionsArray = this.fb.array(
              (variant.options as any[]).map(
                (opt) =>
                  this.newOption(
                    opt.name,
                    opt.priceModifier,
                    opt.stock,
                    opt.costPrice
                  ) // Pasar el costo
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

  // --- FUNCIÓN onFilesSelected CORREGIDA ---
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      const previewUrls = this.selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      this.imagePreviews.set(previewUrls);
    }
  }

  // --- FUNCIÓN handleSubmit CON CORRECCIÓN DE TIPADO ---
  handleSubmit() {
    console.log('--- handleSubmit INICIADO ---');
    this.productForm.markAllAsTouched();

    // Validaciones primarias (sin cambios)
    if (this.images.length === 0 && this.selectedFiles.length === 0) {
      this.toastService.show(
        'Por favor, añade al menos una imagen para el producto.'
      );
      return;
    }
    if (this.productForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos correctamente.'
      );
      return;
    }

    console.log('--- FORMULARIO VÁLIDO ---');
    this.isUploading.set(true);

    // --- ¡LÓGICA SIMPLIFICADA Y CORREGIDA! ---

    // CASO 1: Hay nuevos archivos para subir
    if (this.selectedFiles.length > 0) {
      console.log('--- Detectados nuevos archivos. Subiendo imágenes... ---');
      const uploadOperations$ = forkJoin(
        this.selectedFiles.map((file) => this.storageService.uploadImage(file))
      );

      uploadOperations$.subscribe({
        next: (newImageUrls) => {
          // Al subir nuevas imágenes, reemplazamos TODAS las anteriores.
          this.images.clear();
          newImageUrls.forEach((url: string) =>
            this.images.push(this.fb.control(url))
          );
          console.log(
            '--- Imágenes subidas. Guardando datos del producto... ---'
          );
          this.saveProductData(); // Guardamos con las nuevas URLs
        },
        error: (err) => {
          this.isUploading.set(false);
          console.error('Error al subir las imágenes:', err);
          this.toastService.show('No se pudieron subir las imágenes.');
        },
      });
    }
    // CASO 2: No hay archivos nuevos, solo guardar los cambios de texto/precio/etc.
    else {
      console.log(
        '--- No hay nuevos archivos. Guardando datos del producto directamente... ---'
      );
      // Las URLs existentes ya están en el FormArray 'images' desde ngOnInit.
      this.saveProductData();
    }
  }

  private saveProductData(): void {
    const formValue = this.productForm.getRawValue();

    const productPayload = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      category: formValue.category,
      images: formValue.images,
      isFeatured: formValue.isFeatured,
      isOnSale: formValue.isOnSale,
      salePrice: formValue.isOnSale ? formValue.salePrice : null,
      variants: formValue.variants.map((variant: any) => ({
        name: variant.name,
        options: variant.options.map((option: any) => ({
          name: option.name,
          priceModifier: option.priceModifier,
          stock: option.stock,
        })),
      })),
    };

    console.log(
      '--- FRONTEND TRACE: Payload limpio que se envía al backend ---',
      productPayload
    );

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId!, productPayload)
      : this.productService.createProduct(productPayload);

    operation.subscribe({
      next: () => {
        this.isUploading.set(false);
        this.toastService.show(
          `Producto ${this.isEditMode() ? 'actualizado' : 'creado'} con éxito`
        );
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error al guardar el producto:', err);
        this.toastService.show(
          err.error.details ||
            err.error.message ||
            'No se pudo guardar el producto.'
        );
      },
    });
  }

  // --- MÉTODOS PARA VARIANTES (sin cambios) ---
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
  newOption(name = '', priceModifier = 0, stock = 0, costPrice = 0): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      priceModifier: [priceModifier, [Validators.required, Validators.min(0)]],
      stock: [stock, [Validators.required, Validators.min(0)]],
      costPrice: [costPrice, [Validators.required, Validators.min(0)]], // Campo de costo por opción
    });
  }
  addVariantOption(variantIndex: number): void {
    this.variantOptions(variantIndex).push(this.newOption());
  }
  removeVariantOption(variantIndex: number, optionIndex: number): void {
    this.variantOptions(variantIndex).removeAt(optionIndex);
  }
}
