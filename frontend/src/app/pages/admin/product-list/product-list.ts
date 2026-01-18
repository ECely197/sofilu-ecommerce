import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
} from 'rxjs/operators';

import { ProductServices } from '../../../services/product';
import { Product } from '../../../interfaces/product.interface';
import { RippleDirective } from '../../../directives/ripple';
// Importamos los servicios de UI
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective, ReactiveFormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('50ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class ProductList implements OnInit {
  private productService = inject(ProductServices);
  private toastService = inject(ToastService); // Inyectar Toast
  private confirmationService = inject(ConfirmationService); // Inyectar Confirmación

  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  searchControl = new FormControl('');

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.isLoading.set(true);
          return this.productService.searchProducts({
            search: searchTerm || '',
          });
        }),
      )
      .subscribe({
        next: (data) => {
          this.products.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al buscar productos:', err);
          this.isLoading.set(false);
        },
      });
  }

  fetchProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Cambia la visibilidad del producto (Ojo).
   * 'Activo' = Visible, 'Agotado' = Oculto en este contexto de admin rápido.
   */
  toggleStatus(product: Product): void {
    const newStatus = product.status === 'Activo' ? 'Agotado' : 'Activo';
    const msg = newStatus === 'Activo' ? 'Producto visible' : 'Producto oculto';

    // Actualización optimista en la UI
    this.products.update((current) =>
      current.map((p) =>
        p._id === product._id ? { ...p, status: newStatus } : p,
      ),
    );

    this.productService.updateProductStatus(product._id, newStatus).subscribe({
      next: () => {
        this.toastService.show(msg, 'success');
      },
      error: (err) => {
        // Revertir si falla
        this.products.update((current) =>
          current.map((p) => (p._id === product._id ? product : p)),
        );
        this.toastService.show('Error al cambiar estado.', 'error');
        console.error(err);
      },
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    // Usamos el modal bonito en lugar de window.confirm
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Producto?',
      message: 'Esta acción no se puede deshacer. ¿Estás seguro?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.products.update((current) =>
            current.filter((p) => p._id !== productId),
          );
          this.toastService.show('Producto eliminado.', 'success');
        },
        error: (err) => {
          this.toastService.show('Error al eliminar.', 'error');
          console.error(err);
        },
      });
    }
  }

  calculateTotalStock(product: Product): number {
    if (!product.variants || product.variants.length === 0) {
      return product.stock || 0;
    }
    return product.variants.reduce(
      (total, variant) =>
        total +
        variant.options.reduce(
          (subTotal, option) => subTotal + (option.stock || 0),
          0,
        ),
      0,
    );
  }
}
