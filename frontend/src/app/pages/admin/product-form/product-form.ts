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
// ¡NUEVAS IMPORTACIONES CORRECTAS!
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

  productForm!: FormGroup;
  isEditMode = signal(false);
  private productId: string | null = null;
  vendors = signal<Vendor[]>([]);
  categories = signal<Category[]>([]);
  imagePreviews = signal<string[]>([]);
  private selectedFiles: File[] = [];
  isUploading = signal(false);
  variantTemplates = signal<VariantTemplate[]>([]);

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      sku: [''],
      vendor: [null],
      price: [null, [Validators.min(0)]],
      costPrice: [null, [Validators.min(0)]],
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

    this.vendorService
      .getVendors()
      .subscribe((vends) => this.vendors.set(vends));

    this.variantTemplateService.getTemplates().subscribe((templates) => {
      this.variantTemplates.set(templates);
    });

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
            sku: product.sku,
            vendor: (product.vendor as Vendor)?._id,
            price: product.price,
            costPrice: product.costPrice,
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
              (variant.options as any[]).map((opt) =>
                this.newOption(opt.name, opt.price, opt.stock, opt.costPrice)
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
    }
  }

  handleSubmit() {
    console.log('--- handleSubmit INICIADO ---');
    this.productForm.markAllAsTouched();

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

    if (this.selectedFiles.length > 0) {
      console.log('--- Detectados nuevos archivos. Subiendo imágenes... ---');
      const uploadOperations$ = forkJoin(
        this.selectedFiles.map((file) => this.storageService.uploadImage(file))
      );

      uploadOperations$.subscribe({
        next: (newImageUrls) => {
          this.images.clear();
          newImageUrls.forEach((url: string) =>
            this.images.push(this.fb.control(url))
          );
          console.log(
            '--- Imágenes subidas. Guardando datos del producto... ---'
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
        '--- No hay nuevos archivos. Guardando datos del producto directamente... ---'
      );

      this.saveProductData();
    }
  }

  private saveProductData(): void {
    const formValue = this.productForm.getRawValue();

    const productPayload = {
      name: formValue.name,
      description: formValue.description,
      sku: formValue.sku,
      vendor: formValue.vendor,
      category: formValue.category,
      price: formValue.price,
      costPrice: formValue.costPrice,
      isOnSale: formValue.isOnSale,
      salePrice: formValue.isOnSale ? formValue.salePrice : null,
      images: formValue.images,
      isFeatured: formValue.isFeatured,
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
          'success'
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
          'error'
        );
      },
    });
  }

  onTemplateSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedTemplateName = (selectElement as any).value;
    const selectedTemplate = this.variantTemplates().find(
      (t) => t.templateName === selectedTemplateName
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
            opt.image
          )
        )
      ),
    });
    this.variants.push(newVariant);
    this.toastService.show(
      `Variante "${template.variantName}" añadida desde plantilla.`,
      'success'
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
    image: string | null = null
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
}
