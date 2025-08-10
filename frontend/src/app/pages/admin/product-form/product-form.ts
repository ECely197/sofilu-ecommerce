
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductServices } from '../../../services/product';
// YA NO NECESITAMOS StorageService
// import { StorageService } from '../../../services/storage'; 
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit {
  // --- INYECCIÓN DE SERVICIOS ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);
  // private storageService = inject(StorageService); // Eliminado

  // --- PROPIEDADES DEL COMPONENTE ---
  productForm!: FormGroup;
  productId: string | null = null;
  isEditMode: boolean = false;
  // Ya no manejamos archivos, solo URLs
  // selectedFiles: File[] = [];
  // isUploading: boolean = false; // Eliminado

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      // ¡El FormArray de imágenes ahora contendrá FormControls de strings (URLs)!
      images: this.fb.array([this.newImageControl()], Validators.required),
      isFeatured: [false],
      isOnSale: [false],
      salePrice: [null],
      variants: this.fb.array([])
    });

    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    if (this.isEditMode && this.productId) {
      this.productService.getProductById(this.productId).subscribe(product => {
        // Rellenamos el formulario con los datos del producto
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          isFeatured: product.isFeatured,
          isOnSale: product.isOnSale,
          salePrice: product.salePrice,
        });

        // Rellenamos dinámicamente los FormArrays
        this.images.clear();
        product.images.forEach(imgUrl => this.images.push(this.newImageControl(imgUrl)));

        this.variants.clear();
        product.variants.forEach(variant => {
          const variantGroup = this.newVariant(variant.name);
          const optionsArray = variantGroup.get('options') as FormArray;
          optionsArray.clear(); // Limpiamos la opción por defecto
          variant.options.forEach(opt => optionsArray.push(this.newOption(opt.name)));
          this.variants.push(variantGroup);
        });
      });
    }
  }

  // --- GETTERS PARA FORMARRAYS ---
  get variants() { return this.productForm.get('variants') as FormArray; }
  get images() { return this.productForm.get('images') as FormArray; }

  // --- NUEVOS MÉTODOS PARA IMÁGENES POR URL ---
  newImageControl(url: string = ''): FormControl {
    return this.fb.control(url, Validators.required);
  }

  addImageControl(): void {
    this.images.push(this.newImageControl());
  }

  removeImageControl(index: number): void {
    this.images.removeAt(index);
  }

  // --- MÉTODOS PARA VARIANTES (Ligeramente modificados para edición) ---
  newVariant(name: string = ''): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      options: this.fb.array([this.newOption()])
    });
  }
  addVariant(): void { this.variants.push(this.newVariant()); }
  removeVariant(variantIndex: number): void { this.variants.removeAt(variantIndex); }

  variantOptions(variantIndex: number): FormArray {
    return this.variants.at(variantIndex).get('options') as FormArray;
  }

  newOption(name: string = ''): FormGroup {
    return this.fb.group({ name: [name, Validators.required] });
  }
  addVariantOption(variantIndex: number): void { this.variantOptions(variantIndex).push(this.newOption()); }
  removeVariantOption(variantIndex: number, optionIndex: number): void { this.variantOptions(variantIndex).removeAt(optionIndex); }


  // --- MÉTODO PRINCIPAL DE GUARDADO (SIMPLIFICADO) ---
  handleSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const productData = this.productForm.getRawValue();

    // ----- PREPARACIÓN Y VALIDACIÓN DE DATOS (VERSIÓN FINAL) -----

    productData.images = productData.images.filter((url: string) => url && url.trim() !== '');
    if (productData.images.length === 0) {
      alert('Debes añadir al menos una URL de imagen válida.');
      return;
    }

    productData.price = Number(productData.price);
    if (isNaN(productData.price) || productData.price <= 0) {
      alert('El precio base debe ser un número válido y mayor que cero.');
      return;
    }

    if (productData.isOnSale) {
      const discountValue = Number(productData.salePrice);
      if (isNaN(discountValue) || discountValue <= 0) {
        alert('El valor del descuento debe ser un número válido y mayor que cero.');
        return;
      }

      // --- ¡LÓGICA DE DESCUENTO EXPLÍCITA! ---
      // Asumiremos que el campo 'salePrice' ahora contiene un DESCUENTO PORCENTUAL.
      // Calculamos el precio final.
      if (discountValue >= 100) {
        alert('El descuento porcentual no puede ser 100% o más.');
        return;
      }
      const finalSalePrice = productData.price * (1 - (discountValue / 100));
      productData.salePrice = Math.round(finalSalePrice); // Enviamos el precio final calculado

    } else {
      delete productData.salePrice;
    }

    // --- Log de depuración ---
    console.log('--- ENVIANDO DATOS AL BACKEND (VERSIÓN FINAL) ---');
    console.log(JSON.stringify(productData, null, 2));

    // --- El resto del método no cambia ---
    const onSaveSuccess = (mode: 'creado' | 'actualizado') => { /* ... */ };
    const onSaveError = (err: any, mode: 'crear' | 'actualizar') => { /* ... */ };

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData)
        .subscribe({ next: () => onSaveSuccess('actualizado'), error: (err) => onSaveError(err, 'actualizar') });
    } else {
      this.productService.createProduct(productData)
        .subscribe({ next: () => onSaveSuccess('creado'), error: (err) => onSaveError(err, 'crear') });
    }
  }
}