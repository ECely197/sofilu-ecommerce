import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductServices } from '../../../services/product';
import { StorageService } from '../../../services/storage';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);
  private storageService = inject(StorageService);

  productForm!: FormGroup;
  productId: string | null = null;
  isEditMode: boolean = false;
  selectedFile: File | null = null;
  isUploading: boolean = false;

  ngOnInit() {
    this.productForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      price: new FormControl(null, [Validators.required, Validators.min(0)]),
      imageUrl: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required)
    });

    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    if (this.isEditMode && this.productId) {
      this.productService.getProductById(this.productId).subscribe(product => {
        this.productForm.patchValue(product);
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Actualizamos la vista previa con la imagen local
      this.productForm.patchValue({ imageUrl: URL.createObjectURL(this.selectedFile) });
    }
  }

  // --- MÉTODO handleSubmit ACTUALIZADO ---
  handleSubmit() {
    if (this.productForm.invalid) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    // Decisión: ¿Hay un archivo para subir o usamos la URL del campo de texto?
    if (this.selectedFile) {
      // CASO 1: El usuario seleccionó un archivo. Hay que subirlo.
      this.isUploading = true;
      this.storageService.uploadImage(this.selectedFile).subscribe({
        next: (downloadURL) => {
          this.isUploading = false;
          console.log('Imagen subida, URL final:', downloadURL);
          // Actualizamos el formulario con la URL de Firebase
          this.productForm.patchValue({ imageUrl: downloadURL });
          // Y procedemos a guardar el producto con la nueva URL
          this.saveProductData();
        },
        error: (err) => {
          this.isUploading = false;
          alert('Error al subir la imagen.');
          console.error(err);
        }
      });
    } else {
      // CASO 2: No se seleccionó archivo. Usamos la URL que está en el campo de texto.
      console.log('No se subió archivo nuevo, usando la URL del formulario.');
      this.saveProductData();
    }
  }
  
  saveProductData() {
    const productData = this.productForm.getRawValue();

    const onSaveSuccess = (mode: 'creado' | 'actualizado') => {
      alert(`Producto ${mode} con éxito`);
      this.router.navigate(['/admin/products']);
    };

    const onSaveError = (err: any, mode: 'crear' | 'actualizar') => {
      console.error(`Error al ${mode} el producto:`, err);
    };

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData)
        .subscribe({
          next: () => onSaveSuccess('actualizado'),
          error: (err) => onSaveError(err, 'actualizar')
        });
    } else {
      this.productService.createProduct(productData)
        .subscribe({
          next: () => onSaveSuccess('creado'),
          error: (err) => onSaveError(err, 'crear')
        });
    }
  }
}