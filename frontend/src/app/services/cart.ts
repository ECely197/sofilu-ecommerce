// Contenido para: src/app/services/cart.ts
import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../interfaces/cart-item.interface';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  totalItems = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  subTotal = computed(() => {
    return this.cartItems().reduce((total, item) => {
      // 1. Empezamos con el precio base del producto.
      let itemPrice = item.product.price;

      // 2. Sumamos los modificadores de las variantes seleccionadas.
      if (item.selectedVariants && item.product.variants) {
        for (const variantName in item.selectedVariants) {
          const selectedOptionName = item.selectedVariants[variantName];
          const variant = item.product.variants.find(
            (v) => v.name === variantName
          );
          const option = variant?.options.find(
            (o) => o.name === selectedOptionName
          );
          if (option && option.price) {
            itemPrice += option.price;
          }
        }
      }

      // 3. Multiplicamos el precio final del ítem por su cantidad y lo sumamos al total.
      return total + itemPrice * item.quantity;
    }, 0);
  });

  constructor() {}

  private generateItemId(
    productId: string,
    variants: { [key: string]: string }
  ): string {
    const sortedVariantKeys = Object.keys(variants).sort();
    const variantString = sortedVariantKeys
      .map((key) => `${key}-${variants[key]}`)
      .join('-');
    return `${productId}-${variantString}`;
  }

  // MÉTODO ACTUALIZADO: Acepta el producto y las variantes seleccionadas
  addItem(
    product: Product,
    selectedVariants: { [key: string]: string },
    quantityToAdd: number
  ): void {
    const itemId = this.generateItemId(product._id, selectedVariants);

    this.cartItems.update((items) => {
      const existingItem = items.find((item) => item.id === itemId);

      if (existingItem) {
        // Si el item ya existe, incrementamos su cantidad por la cantidad que se añade.
        return items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        // Si es un item nuevo, lo añadimos con la cantidad especificada.
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity: quantityToAdd, // <-- Usamos la cantidad del parámetro.
          selectedVariants,
        };
        return [...items, newItem];
      }
    });
  }

  // MÉTODO ACTUALIZADO: Usa el ID único del ítem
  removeItem(itemId: string): void {
    this.cartItems.update((items) =>
      items.filter((item) => item.id !== itemId)
    );
  }

  // MÉTODO ACTUALIZADO: Usa el ID único del ítem
  updateQuantity(itemId: string, newQuantity: number): void {
    this.cartItems.update((items) => {
      if (newQuantity <= 0) {
        return items.filter((item) => item.id !== itemId);
      }
      return items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : { ...item }
      );
    });
  }

  clearCart(): void {
    this.cartItems.set([]);
  }
}
