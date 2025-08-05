import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../interfaces/cart-item.interface';
import { Product } from '../interfaces/product.interface';


@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  totalItems = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  subTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0)
  );

  constructor() { }

  addItem(product: Product): void {
    this.cartItems.update(items => {
      const existingItem = items.find(item => item.product._id === product._id);
      if (existingItem) {
        return items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...items, { product, quantity: 1 }];
      }
    });
  }

  removeItem(productId: string): void {
    this.cartItems.update(items =>
      items.filter(item => item.product._id !== productId)
    );
  }

  updateQuantity(productId: string, newQuantity: number): void {
    this.cartItems.update(items => {
      if (newQuantity <= 0) {
        return items.filter(item => item.product._id !== productId);
      }
      return items.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  }
  clearCart(): void {
    this.cartItems.set([]);
  }

}