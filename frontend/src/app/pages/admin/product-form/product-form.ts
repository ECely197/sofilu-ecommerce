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
      price: [0, [Validators.required, Validators.min(0)]], // Es buena práctica inicializar en 0
      category: [null, Validators.required],
      images: this.fb.array([], [Validators.required, Validators.minLength(1)]),
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
          // --- ¡CORRECCIÓN CRÍTICA AQUÍ! ---
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            // Al parchear el formulario, nos aseguramos de asignar solo el _id de la categoría.
            // El '?' (optional chaining) previene errores si la categoría no viniera populada.
            category: (product.category as Category)?._id,
            isFeatured: product.isFeatured,
            isOnSale: product.isOnSale,
            salePrice: product.salePrice,
          });

          // El resto de la lógica para cargar imágenes y variantes está bien
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

    const uploadOperations =
      this.selectedFiles.length > 0
        ? this.selectedFiles.map((file) =>
            this.storageService.uploadImage(file)
          )
        : of(this.images.value);

    forkJoin(uploadOperations).subscribe({
      next: (downloadURLs) => {
        this.images.clear();
        downloadURLs.forEach((url) => this.images.push(this.fb.control(url)));
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
    const formValue = this.productForm.getRawValue();

    // 1. Creamos el objeto base del payload
    const productPayload = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      category: formValue.category, // Ya es solo el ID gracias al cambio en ngOnInit
      images: formValue.images,
      isFeatured: formValue.isFeatured,
      isOnSale: formValue.isOnSale,
      salePrice: formValue.isOnSale ? formValue.salePrice : null, // Si no está en oferta, el precio de oferta es nulo

      // 2. "Limpiamos" las variantes para quitar campos extra que añade Angular (como _id)
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
      '--- FRONTEND TRACE: Payload limpio que se envía al backend ---'
    );
    console.log(JSON.stringify(productPayload, null, 2));

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId!, productPayload)
      : this.productService.createProduct(productPayload);

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
        // Ahora, gracias al cambio en el backend, el mensaje de error será más útil
        alert(
          err.error.details ||
            err.error.message ||
            'No se pudo guardar el producto.'
        );
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
