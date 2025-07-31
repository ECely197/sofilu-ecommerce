import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../interfaces/product.interface';
import { AuthService } from './auth';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // Inyectamos el servicio de autenticación
  private apiUrl = 'http://localhost:3000/api/wishlist';
  
  // Creamos un signal para guardar la lista de IDs de los productos en la wishlist
  wishlistProductIds = signal<string[]>([]);
  
  wishlistProducts = signal<Product[]>([]);
   constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchWishlist(user.uid);
      } else {
        this.wishlistProductIds.set([]);
        this.wishlistProducts.set([]); // ¡También limpiamos los productos!
      }
    });
  }

  private fetchWishlist(userId: string): void {
    this.http.get<{ products: Product[] }>(`${this.apiUrl}/${userId}`)
      .pipe(take(1))
      .subscribe(wishlist => {
        const productIds = wishlist.products.map(p => p._id);
        this.wishlistProductIds.set(productIds);
        // ¡Actualizamos el nuevo signal con los productos completos!
        this.wishlistProducts.set(wishlist.products);
      });
  }

  addProduct(product: Product): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.http.post<{ products: Product[] }>(`${this.apiUrl}/${user.uid}`, { productId: product._id })
      .pipe(take(1))
      .subscribe(updatedWishlist => {
        const productIds = updatedWishlist.products.map(p => p._id);
        this.wishlistProductIds.set(productIds);
        // ¡Actualizamos también los productos completos!
        this.wishlistProducts.set(updatedWishlist.products);
      });
  }
  
  removeProduct(product: Product): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.http.delete<{ products: Product[] }>(`${this.apiUrl}/${user.uid}/${product._id}`)
      .pipe(take(1))
      .subscribe(updatedWishlist => {
        const productIds = updatedWishlist.products.map(p => p._id);
        this.wishlistProductIds.set(productIds);
        // ¡Y aquí también!
        this.wishlistProducts.set(updatedWishlist.products);
      });
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds().includes(productId);
  }

  
}