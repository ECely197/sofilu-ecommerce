import { Injectable, computed, signal, effect } from '@angular/core';
import { CartItem } from '../interfaces/cart-item.interface';
import { Product } from '../interfaces/product.interface';

// Clave única para guardar en localStorage
const CART_STORAGE_KEY = 'sofilu_cart_items';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  /**
   * @property {WritableSignal<CartItem[]>} cartItems
   * El estado principal del carrito. AHORA SE INICIALIZA DESDE LOCALSTORAGE.
   */
  cartItems = signal<CartItem[]>(this.loadCartFromStorage());

  /**
   * @property {Signal<number>} totalItems
   * Se recalcula automáticamente cuando `cartItems` cambia.
   */
  totalItems = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  /**
   * @property {Signal<number>} subTotal
   * Deriva el subtotal del carrito.
   */
  subTotal = computed(() => {
    // (Tu lógica de cálculo de subtotal se mantiene igual, es perfecta)
    return this.cartItems().reduce((total, item) => {
      let itemPrice = item.product.price;
      if (item.selectedVariants && item.product.variants) {
        for (const variantName in item.selectedVariants) {
          const selectedOptionName = item.selectedVariants[variantName];
          const variant = item.product.variants.find(
            (v) => v.name === variantName
          );
          const option = variant?.options.find(
            (o) => o.name === selectedOptionName
          );
          if (option?.price) {
            itemPrice += option.price;
          }
        }
      }
      return total + itemPrice * item.quantity;
    }, 0);
  });

  constructor() {
    // --- EFECTO DE AUTO-GUARDADO ---
    // Cada vez que el carrito cambie, se guarda automáticamente en localStorage.
    effect(() => {
      this.saveCartToStorage(this.cartItems());
    });
  }

  // --- MÉTODOS PÚBLICOS (Añadir, quitar, etc.) ---

  addItem(
    product: Product,
    selectedVariants: { [key: string]: string },
    quantityToAdd: number
  ): void {
    const itemId = this.generateItemId(product._id, selectedVariants);
    this.cartItems.update((items) => {
      const existingItem = items.find((item) => item.id === itemId);
      if (existingItem) {
        return items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity: quantityToAdd,
          selectedVariants,
        };
        return [...items, newItem];
      }
    });
  }

  removeItem(itemId: string): void {
    this.cartItems.update((items) =>
      items.filter((item) => item.id !== itemId)
    );
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    this.cartItems.update((items) => {
      if (newQuantity <= 0) {
        return items.filter((item) => item.id !== itemId);
      }
      return items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  // --- MÉTODOS PRIVADOS PARA GESTIONAR LOCALSTORAGE ---

  /** Carga el carrito desde localStorage al iniciar el servicio. */
  private loadCartFromStorage(): CartItem[] {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    }
    return [];
  }

  /** Guarda el estado actual del carrito en localStorage. */
  private saveCartToStorage(items: CartItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }

  private generateItemId(
    productId: string,
    variants: { [key: string]: string }
  ): string {
    const sortedVariantKeys = Object.keys(variants).sort();
    const variantString = sortedVariantKeys
      .map((key) => `${key}-${variants[key]}`)
      .join('_');
    return variantString ? `${productId}-${variantString}` : productId;
  }
}
