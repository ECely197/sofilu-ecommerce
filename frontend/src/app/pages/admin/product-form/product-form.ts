import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';

// Servicios
import { ProductServices } from '../../../services/product';
import { StorageService } from '../../../services/storage';
import { CategoryService, Category } from '../../../services/category.service';
import { ToastService } from '../../../services/toast.service';
import { VendorService, Vendor } from '../../../services/vendor.service';
import {
  WarrantyService,
  WarrantyType,
} from '../../../services/warranty.service';

import {
  VariantTemplateService,
  VariantTemplate,
} from '../../../services/variant-template.service';

// Tipos y Directivas
import { Product } from '../../../interfaces/product.interface';
import { RippleDirective } from '../../../directives/ripple';
import { NumericFormatDirective } from '../../../directives/numeric-format';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RippleDirective,
    NumericFormatDirective,
  ],
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
  private variantTemplateService = inject(VariantTemplateService);
  private vendorService = inject(VendorService);
  private warrantyService = inject(WarrantyService);

  productForm!: FormGroup;
  isEditMode = signal(false);
  private productId: string | null = null;
  vendors = signal<Vendor[]>([]);
  categories = signal<Category[]>([]);
  imagePreviews = signal<string[]>([]);
  private selectedFiles: File[] = [];
  isUploading = signal(false);
  variantTemplates = signal<VariantTemplate[]>([]);
  warranties = signal<WarrantyType[]>([]);
  isCategoryDropdownOpen = signal(false);

  ngOnInit() {
    // 1. Inicialización del Formulario
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      sku: [''],
      vendor: [null],
      price: [null, [Validators.min(0)]],
      costPrice: [null, [Validators.min(0)]],
      stock: [null, [Validators.min(0)]],
      categories: [[], Validators.required], // Array para multi-select
      images: this.fb.array([]),
      isFeatured: [false],
      isOnSale: [false],
      salePrice: [null],
      warrantyType: [null],
      variants: this.fb.array([]),
    });

    // 2. Cargar Dependencias (Selects)
    this.warrantyService
      .getWarranties()
      .subscribe((w) => this.warranties.set(w));

    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));

    this.vendorService
      .getVendors()
      .subscribe((vends) => this.vendors.set(vends));

    this.variantTemplateService.getTemplates().subscribe((templates) => {
      this.variantTemplates.set(templates);
    });

    // 3. Cargar Datos del Producto (Modo Edición)
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.isEditMode.set(true);

      this.productService
        .getProductById(this.productId)
        .subscribe((product) => {
          // --- LOGICA DE CATEGORÍAS (Robustez) ---
          // Verifica si es el formato nuevo (array) o el viejo (single)
          let categoryIds: string[] = [];

          if (
            product.categories &&
            Array.isArray(product.categories) &&
            product.categories.length > 0
          ) {
            // Caso 1: Nuevo formato (Array de objetos o IDs)
            categoryIds = product.categories.map((c: any) =>
              typeof c === 'object' ? c._id : c,
            );
          } else if ((product as any).category) {
            // Caso 2: Formato antiguo (Un solo ID u objeto)
            const cat = (product as any).category;
            categoryIds = [typeof cat === 'object' ? cat._id : cat];
          }

          // --- LÓGICA DE GARANTÍA (Robustez) ---
          // Extrae el ID si viene populado como objeto
          const warrantyId = product.warrantyType
            ? typeof product.warrantyType === 'object'
              ? (product.warrantyType as any)._id
              : product.warrantyType
            : null;

          // --- LÓGICA DE VENDEDOR ---
          const vendorId = product.vendor
            ? typeof product.vendor === 'object'
              ? (product.vendor as any)._id
              : product.vendor
            : null;

          // Asignar valores al formulario
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            sku: product.sku,
            vendor: vendorId,
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            categories: categoryIds, // Usamos el array procesado
            isFeatured: product.isFeatured,
            isOnSale: product.isOnSale,
            warrantyType: warrantyId, // Usamos el ID procesado
            salePrice: product.salePrice,
          });

          // Cargar Imágenes
          if (product.images) {
            product.images.forEach((imgUrl) =>
              this.images.push(this.fb.control(imgUrl)),
            );
            this.imagePreviews.set([...product.images]);
          }

          // Cargar Variantes
          if (product.variants) {
            product.variants.forEach((variant) => {
              const optionsArray = this.fb.array(
                (variant.options as any[]).map((opt) =>
                  this.newOption(
                    opt.name,
                    opt.price,
                    opt.stock,
                    opt.costPrice,
                    opt.image,
                  ),
                ),
              );
              this.variants.push(
                this.fb.group({ name: variant.name, options: optionsArray }),
              );
            });
          }
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
        URL.createObjectURL(file),
      );
      this.imagePreviews.set(previewUrls);
    }
  }

  handleSubmit() {
    console.log('--- handleSubmit INICIADO ---');
    this.productForm.markAllAsTouched();

    if (this.images.length === 0 && this.selectedFiles.length === 0) {
      this.toastService.show(
        'Por favor, añade al menos una imagen para el producto.',
      );
      return;
    }
    if (this.productForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos correctamente.',
      );
      return;
    }

    console.log('--- FORMULARIO VÁLIDO ---');
    this.isUploading.set(true);

    if (this.selectedFiles.length > 0) {
      console.log('--- Detectados nuevos archivos. Subiendo imágenes... ---');
      const uploadOperations$ = forkJoin(
        this.selectedFiles.map((file) => this.storageService.uploadImage(file)),
      );

      uploadOperations$.subscribe({
        next: (newImageUrls) => {
          this.images.clear();
          newImageUrls.forEach((url: string) =>
            this.images.push(this.fb.control(url)),
          );
          console.log(
            '--- Imágenes subidas. Guardando datos del producto... ---',
          );
          this.saveProductData();
        },
        error: (err) => {
          this.isUploading.set(false);
          console.error('Error al subir las imágenes:', err);
          this.toastService.show('No se pudieron subir las imágenes.');
        },
      });
    } else {
      console.log(
        '--- No hay nuevos archivos. Guardando datos del producto directamente... ---',
      );

      this.saveProductData();
    }
  }

  // --- MÉTODOS PARA EL MULTI-SELECT ---

  toggleCategory(categoryId: string): void {
    const currentCategories = this.productForm.get('categories')?.value || [];
    const index = currentCategories.indexOf(categoryId);

    if (index > -1) {
      // Si ya existe, lo quitamos
      currentCategories.splice(index, 1);
    } else {
      // Si no, lo agregamos
      currentCategories.push(categoryId);
    }

    // Actualizamos el form control manualmente
    this.productForm.patchValue({ categories: currentCategories });
    this.productForm.get('categories')?.markAsDirty();
  }

  isCategorySelected(categoryId: string): boolean {
    const current = this.productForm.get('categories')?.value || [];
    return current.includes(categoryId);
  }

  // Helper para mostrar nombres en los chips
  getCategoryName(id: string): string {
    const cat = this.categories().find((c) => c._id === id);
    return cat ? cat.name : 'Desconocida';
  }

  private saveProductData(): void {
    const formValue = this.productForm.getRawValue();

    const productPayload = {
      name: formValue.name,
      description: formValue.description,
      sku: formValue.sku,
      vendor: formValue.vendor,
      categories: formValue.categories,
      price: formValue.price,
      costPrice: formValue.costPrice,
      stock: formValue.stock,
      isOnSale: formValue.isOnSale,
      salePrice: formValue.isOnSale ? formValue.salePrice : null,
      images: formValue.images,
      isFeatured: formValue.isFeatured,
      warrantyType: formValue.warrantyType,
      variants: formValue.variants.map((variant: any) => ({
        name: variant.name,
        options: variant.options.map((option: any) => ({
          name: option.name,
          price: option.price,
          stock: option.stock,
          costPrice: option.costPrice,
          image: option.image,
        })),
      })),
    };

    console.log('--- Payload enviado al backend ---', productPayload);

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId!, productPayload)
      : this.productService.createProduct(productPayload);

    operation.subscribe({
      next: () => {
        this.isUploading.set(false);
        this.toastService.show(
          `Producto ${this.isEditMode() ? 'actualizado' : 'creado'} con éxito`,
          'success',
        );
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Error al guardar el producto:', err);
        this.toastService.show(
          err.error?.details ||
            err.error?.message ||
            'No se pudo guardar el producto.',
          'error',
        );
      },
    });
  }

  onTemplateSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedTemplateName = (selectElement as any).value;
    const selectedTemplate = this.variantTemplates().find(
      (t) => t.templateName === selectedTemplateName,
    );

    if (selectedTemplate) {
      this.addVariantFromTemplate(selectedTemplate);
    }
  }

  addVariantFromTemplate(template: VariantTemplate): void {
    if (!template) return;

    const newVariant = this.fb.group({
      name: [template.variantName, Validators.required],
      options: this.fb.array(
        template.options.map((opt) =>
          this.newOption(
            opt.name,
            opt.price,
            opt.stock,
            opt.costPrice,
            opt.image,
          ),
        ),
      ),
    });
    this.variants.push(newVariant);
    this.toastService.show(
      `Variante "${template.variantName}" añadida desde plantilla.`,
      'success',
    );
  }

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
    name = '',
    price: number | null = null,
    stock: number | null = null,
    costPrice: number | null = null,
    image: string | null = null,
  ): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      price: [price, [Validators.required, Validators.min(0)]],
      stock: [stock, [Validators.required, Validators.min(0)]],
      costPrice: [costPrice, [Validators.min(0)]],
      image: [image],
      imageFile: [null],
    });
  }
  addVariantOption(variantIndex: number): void {
    this.variantOptions(variantIndex).push(this.newOption());
  }
  removeVariantOption(variantIndex: number, optionIndex: number): void {
    this.variantOptions(variantIndex).removeAt(optionIndex);
  }

  /**
   * Maneja la selección de un archivo de imagen para una opción de variante específica.
   * @param event El evento del input de tipo 'file'.
   * @param variantIndex El índice de la variante.
   * @param optionIndex El índice de la opción dentro de la variante.
   */
  onVariantImageSelected(
    event: Event,
    variantIndex: number,
    optionIndex: number,
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const option = this.variantOptions(variantIndex).at(
        optionIndex,
      ) as FormGroup;

      // Guardamos el objeto File en el formulario para subirlo más tarde.
      option.patchValue({ imageFile: file });

      // Creamos una URL local para la vista previa instantánea.
      const reader = new FileReader();
      reader.onload = () => {
        // La URL de la vista previa se guarda en el campo 'image' para que el <img> la muestre
        option.patchValue({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }
}
