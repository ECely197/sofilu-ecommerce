/**
 * @fileoverview Servicio de Gestión de la Lista de Deseos.
 * Mantiene el estado de la lista de deseos sincronizado con el backend y
 * lo expone a través de Signals para el resto de la aplicación.
 */
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product.interface';
import { AuthService } from './auth';
import { take, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  // --- Inyección de Dependencias ---
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/wishlist`;

  // --- Estado Reactivo con Signals ---
  /** IDs de los productos en la lista de deseos, para comprobaciones rápidas de pertenencia. */
  public wishlistProductIds = signal<string[]>([]);
  /** Objetos de producto completos en la lista de deseos, para mostrar en la UI. */
  public wishlistProducts = signal<Product[]>([]);

  constructor() {
    // Sincronización automática: reacciona a los cambios en el estado de autenticación.
    this.authService.currentUser$
      .pipe(
        switchMap((user) =>
          // Si hay un usuario, obtiene su lista de deseos; si no, emite una lista vacía.
          user
            ? this.http.get<{ products: Product[] }>(
                `${this.apiUrl}/${user.uid}`
              )
            : of({ products: [] })
        )
      )
      .subscribe({
        next: (wishlist) => this.updateLocalWishlist(wishlist?.products || []),
        error: (err) => {
          console.error('Error al cargar la lista de deseos:', err);
          this.updateLocalWishlist([]); // En caso de error, resetea el estado local.
        },
      });
  }

  /**
   * Alterna la presencia de un producto en la lista de deseos.
   * Si ya está, lo elimina. Si no está, lo añade.
   * @param product El producto a añadir o quitar.
   */
  toggleProduct(product: Product): void {
    if (this.wishlistProductIds().includes(product._id)) {
      this.removeProduct(product);
    } else {
      this.addProduct(product);
    }
  }

  /** Añade un producto a la lista de deseos del usuario actual. @private */
  private addProduct(product: Product): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (!user) return;
      this.http
        .post<{ products: Product[] }>(`${this.apiUrl}/${user.uid}`, {
          productId: product._id,
        })
        .subscribe({
          next: (response) =>
            this.updateLocalWishlist(response?.products || []),
        });
    });
  }

  /** Elimina un producto de la lista de deseos del usuario actual. @private */
  private removeProduct(product: Product): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (!user) return;
      this.http
        .delete<{ products: Product[] }>(
          `${this.apiUrl}/${user.uid}/${product._id}`
        )
        .subscribe({
          next: (response) =>
            this.updateLocalWishlist(response?.products || []),
        });
    });
  }

  /**
   * Método centralizado para actualizar los signals del estado local.
   * @param products El array de productos completo recibido del backend.
   * @private
   */
  private updateLocalWishlist(products: Product[]): void {
    const safeProducts = products || [];
    const productIds = safeProducts.map((p) => p._id);
    this.wishlistProductIds.set(productIds);
    this.wishlistProducts.set(safeProducts);
  }
}
