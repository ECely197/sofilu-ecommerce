import { Injectable, inject, signal, computed } from '@angular/core';
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

  // ¡HACEMOS ESTE SIGNAL PÚBLICO!
  public wishlistProductIds = signal<string[]>([]);

  // Este computed es para uso interno o para componentes que necesitan la lista completa
  public wishlistProducts = computed(() => {
    // Aquí puedes tener una lógica para obtener los objetos de producto completos si los necesitas
    return []; // Simplificado por ahora
  });

  constructor() {
    this.authService.currentUser$
      .pipe(
        switchMap((user) =>
          user
            ? this.http.get<{ products: Product[] }>(
                `${this.apiUrl}/${user.uid}`
              )
            : of({ products: [] })
        )
      )
      .subscribe({
        next: (wishlist) => this.updateLocalWishlist(wishlist.products),
        error: (err) => console.error('Error cargando wishlist:', err),
      });
  }

  // Ahora es un método normal, no un computed
  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds().includes(productId);
  }

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
          next: (updatedWishlist) =>
            this.updateLocalWishlist(updatedWishlist.products),
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
          next: (updatedWishlist) =>
            this.updateLocalWishlist(updatedWishlist.products),
        });
    });
  }

  private updateLocalWishlist(products: Product[]): void {
    const productIds = products.map((p) => p._id);
    this.wishlistProductIds.set(productIds);
  }
}
