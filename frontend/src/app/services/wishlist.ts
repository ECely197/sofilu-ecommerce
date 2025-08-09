import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product.interface';
import { AuthService } from './auth';
import { take, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/wishlist`;

  // Signals para el estado local
  wishlistProductIds = signal<string[]>([]);
  wishlistProducts = signal<Product[]>([]);

  constructor() {
    // Nos suscribimos a los cambios del usuario para cargar/limpiar la wishlist
    this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          // Si hay usuario, hacemos la petición a la API
          return this.http.get<{ products: Product[] }>(`${this.apiUrl}/${user.uid}`);
        } else {
          // Si no hay usuario, devolvemos un objeto que simula una wishlist vacía
          return [{ products: [] }];
        }
      })
    ).subscribe(wishlist => {
      this.updateLocalWishlist(wishlist.products);
    });
  }

  toggleProduct(product: Product): void {
    this.http.post<{ products: Product[] }>(this.apiUrl, { productId: product._id })
      .pipe(take(1))
      .subscribe(updatedWishlist => {
        this.updateLocalWishlist(updatedWishlist.products);
      });
  }

  private updateLocalWishlist(products: Product[]): void {
    const productIds = products.map(p => p._id);
    this.wishlistProductIds.set(productIds);
    this.wishlistProducts.set(products);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds().includes(productId);
  }

  addProduct(product: Product): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) return;
      this.http.post<{ products: Product[] }>(`${this.apiUrl}/${user.uid}`, { productId: product._id })
        .pipe(take(1))
        .subscribe(updatedWishlist => this.updateLocalWishlist(updatedWishlist.products));
    });
  }

  removeProduct(product: Product): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) return;
      this.http.delete<{ products: Product[] }>(`${this.apiUrl}/${user.uid}/${product._id}`)
        .pipe(take(1))
        .subscribe(updatedWishlist => this.updateLocalWishlist(updatedWishlist.products));
    });
  }
}