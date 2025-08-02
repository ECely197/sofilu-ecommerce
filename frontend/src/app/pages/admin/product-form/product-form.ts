import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductServices } from '../../../services/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);

  // Creamos el FormGroup para manejar los datos del producto.
  productForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    price: new FormControl(0, [Validators.required, Validators.min(0)]),
    imageUrl: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required)
  });
  
  productId: string | null = null;
  isEditMode: boolean = false;

  ngOnInit() {
    // Leemos el ID de la URL
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId; // Si hay un ID, estamos en modo edición.

    if (this.isEditMode && this.productId) {
      // Si estamos editando, cargamos los datos del producto existente.
      this.productService.getProductById(this.productId).subscribe(product => {
        // Usamos 'patchValue' para rellenar el formulario con los datos del producto.
        this.productForm.patchValue(product);
      });
    }
  }

  handleSubmit() {
  if (this.productForm.invalid) {
    return;
  }

  // Creamos un nuevo objeto, asegurando que los tipos son correctos.
  // Le decimos a TypeScript: "Confía en mí, en este punto, gracias a 'this.productForm.invalid',
  // sé que estos valores no son nulos".
  const productData = {
    name: this.productForm.value.name!,
    description: this.productForm.value.description!,
    price: this.productForm.value.price!,
    imageUrl: this.productForm.value.imageUrl!,
    category: this.productForm.value.category!
  };

  if (this.isEditMode && this.productId) {
    // --- MODO EDICIÓN ---
    this.productService.updateProduct(this.productId, productData)
      .subscribe({
        next: () => {
          console.log('Producto actualizado con éxito');
          this.router.navigate(['/admin/products']);
        },
        error: (err) => console.error('Error al actualizar:', err)
      });
  } else {
    // --- MODO CREACIÓN ---
    this.productService.createProduct(productData)
      .subscribe({
        next: () => {
          console.log('Producto creado con éxito');
          this.router.navigate(['/admin/products']);
        },
        error: (err) => console.error('Error al crear:', err)
      });
  }
}
}
