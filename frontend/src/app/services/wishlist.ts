// En: frontend/src/app/services/wishlist.ts

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
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/wishlist`;

  // --- SIGNALS PÚBLICOS ---
  // Un signal para los IDs (útil para comprobaciones rápidas)
  public wishlistProductIds = signal<string[]>([]);
  // Un signal para los objetos de producto completos (para la UI)
  public wishlistProducts = signal<Product[]>([]);

  constructor() {
    this.authService.currentUser$
      .pipe(
        switchMap(
          (user) =>
            user
              ? this.http.get<{ products: Product[] }>(
                  `${this.apiUrl}/${user.uid}`
                )
              : of({ products: [] }) // Si no hay usuario, devuelve una wishlist vacía
        )
      )
      .subscribe({
        next: (wishlist) => {
          // Nos aseguramos de manejar el caso en que 'wishlist.products' pueda ser nulo o indefinido
          this.updateLocalWishlist(wishlist?.products || []);
        },
        error: (err) => {
          console.error('Error cargando wishlist:', err);
          this.updateLocalWishlist([]); // En caso de error, reseteamos a un array vacío
        },
      });
  }

  // Este método ahora es interno. Los componentes usarán el signal directamente.
  private isInWishlist(productId: string): boolean {
    return this.wishlistProductIds().includes(productId);
  }

  // El método público principal para añadir/quitar
  toggleProduct(product: Product): void {
    if (this.isInWishlist(product._id)) {
      this.removeProduct(product);
    } else {
      this.addProduct(product);
    }
  }

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

  private updateLocalWishlist(products: Product[]): void {
    const safeProducts = products || []; // Aseguramos que 'products' sea siempre un array
    const productIds = safeProducts.map((p) => p._id);

    this.wishlistProductIds.set(productIds);
    this.wishlistProducts.set(safeProducts); // Actualizamos el signal con los productos completos
  }
}
