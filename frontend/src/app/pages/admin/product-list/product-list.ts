import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { ProductServices } from '../../../services/product';
import { Product } from '../../../interfaces/product.interface';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        // Se activa en cualquier cambio
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class ProductList implements OnInit {
  private productService = inject(ProductServices);

  // Usamos signals para un manejo de estado más moderno
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading.set(true); // Inicia la carga
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false); // Finaliza la carga
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.isLoading.set(false); // Finaliza la carga incluso si hay error
      },
    });
  }

  deleteProduct(productId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          // Actualizamos el signal filtrando el producto eliminado
          this.products.update((currentProducts) =>
            currentProducts.filter((p) => p._id !== productId)
          );
        },
        error: (err) => console.error('Error al eliminar el producto:', err),
      });
    }
  }
}
