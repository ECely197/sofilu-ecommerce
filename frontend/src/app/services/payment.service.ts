// Contenido para: frontend/src/app/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem } from '../interfaces/cart-item.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  // Este método toma los items del carrito y el total, y pide una preferencia de pago al backend
  createPreference(
    items: CartItem[],
    total: number
  ): Observable<{ id: string }> {
    // --- ¡PAYLOAD SIMPLIFICADO! ---
    // Ahora enviamos un array de items más simple, solo con lo que el backend necesita.
    const mappedItems = items.map((item) => ({
      name: item.product.name,
      description: Object.values(item.selectedVariants).join(' / '), // Creamos una descripción de las variantes
      picture_url: item.product.images[0] || undefined,
      category_id: (item.product.category as any)._id || item.product.category,
      quantity: item.quantity,
      unit_price: this.calculateFinalItemPrice(item), // Esto ya estaba bien
    }));

    return this.http.post<{ id: string }>(`${this.apiUrl}/create_preference`, {
      items: mappedItems, // Enviamos el nuevo payload
      grandTotal: total,
    });
  }

  // Función de ayuda para calcular el precio final de un item
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
        if (option?.priceModifier) {
          price += option.priceModifier;
        }
      }
    }
    return price;
  }
}
