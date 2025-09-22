/**
 * @fileoverview Servicio de Pagos.
 * Se encarga de la integración con la pasarela de pagos (Mercado Pago en este caso),
 * comunicándose con el backend para crear preferencias de pago.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem } from '../interfaces/cart-item.interface';

// Interfaz para la información del pagador requerida por el backend.
interface PayerInfo {
  name: string;
  surname: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Envía los datos del carrito al backend para crear una "preferencia de pago" en Mercado Pago.
   * @param items Los artículos del carrito.
   * @param total El monto total (este puede no ser usado si el backend recalcula).
   * @param payerInfo La información del cliente que realiza el pago.
   * @returns Un Observable que emite un objeto con el ID de la preferencia.
   */
  createPreference(
    items: CartItem[],
    total: number,
    payerInfo: PayerInfo
  ): Observable<{ id: string }> {
    // Mapea los CartItem a un formato que la API de Mercado Pago entiende (a través de nuestro backend).
    const mappedItems = items.map((item) => ({
      name: item.product.name,
      description:
        Object.values(item.selectedVariants).join(' / ') || 'Producto',
      picture_url: item.product.images[0] || undefined,
      category_id: (item.product.category as any)._id || item.product.category,
      quantity: item.quantity,
      unit_price: this.calculateFinalItemPrice(item),
    }));

    const payload = {
      items: mappedItems,
      payerInfo: payerInfo,
    };

    return this.http.post<{ id: string }>(
      `${this.apiUrl}/create_preference`,
      payload
    );
  }

  /**
   * Función de ayuda para calcular el precio final de un ítem, incluyendo variantes.
   * Esta lógica debe ser idéntica a la del `CartService` para consistencia.
   * @param item El artículo del carrito.
   * @private
   */
  private calculateFinalItemPrice(item: CartItem): number {
    let price = item.product.price;
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
          price += option.price;
        }
      }
    }
    return price;
  }
}
