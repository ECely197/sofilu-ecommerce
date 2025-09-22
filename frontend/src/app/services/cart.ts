/**
 * @fileoverview Servicio de Gestión del Carrito de Compras.
 * Utiliza Angular Signals para una gestión de estado reactiva y altamente eficiente.
 * Es la fuente única de verdad para todo lo relacionado con el contenido del carrito.
 */
import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../interfaces/cart-item.interface';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  /**
   * @property {WritableSignal<CartItem[]>} cartItems
   * El estado principal del carrito. Es un array de los artículos que el usuario ha añadido.
   */
  cartItems = signal<CartItem[]>([]);

  /**
   * @property {Signal<number>} totalItems
   * Un `computed` signal que deriva la cantidad total de productos en el carrito.
   * Se recalcula automáticamente y de forma eficiente cada vez que `cartItems` cambia.
   */
  totalItems = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  /**
   * @property {Signal<number>} subTotal
   * Un `computed` signal que deriva el subtotal del carrito, teniendo en cuenta
   * los precios base de los productos y los modificadores de precio de las variantes.
   */
  subTotal = computed(() => {
    return this.cartItems().reduce((total, item) => {
      let itemPrice = item.product.price;
      // Suma los modificadores de precio de las variantes seleccionadas
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

  /**
   * Añade un producto al carrito o actualiza su cantidad si ya existe.
   * @param product El objeto de producto completo.
   * @param selectedVariants Un mapa de las variantes seleccionadas (ej: { 'Color': 'Rojo' }).
   * @param quantityToAdd La cantidad de productos a añadir.
   */
  addItem(
    product: Product,
    selectedVariants: { [key: string]: string },
    quantityToAdd: number
  ): void {
    const itemId = this.generateItemId(product._id, selectedVariants);

    this.cartItems.update((items) => {
      const existingItem = items.find((item) => item.id === itemId);
      if (existingItem) {
        // Si el ítem ya existe, actualiza su cantidad
        return items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        // Si es nuevo, lo añade al array
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

  /**
   * Elimina un artículo del carrito por completo.
   * @param itemId El ID único del artículo a eliminar.
   */
  removeItem(itemId: string): void {
    this.cartItems.update((items) =>
      items.filter((item) => item.id !== itemId)
    );
  }

  /**
   * Actualiza la cantidad de un artículo específico en el carrito.
   * Si la cantidad es 0 o menos, el artículo se elimina.
   * @param itemId El ID único del artículo a actualizar.
   * @param newQuantity La nueva cantidad.
   */
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

  /**
   * Vacía el carrito por completo.
   */
  clearCart(): void {
    this.cartItems.set([]);
  }

  /**
   * Genera un ID único para un artículo del carrito basado en el ID del producto
   * y sus variantes seleccionadas. Esto permite que el mismo producto con diferentes
   * variantes coexista en el carrito.
   * @private
   */
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
