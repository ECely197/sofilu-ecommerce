// Contenido para: frontend/src/app/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { environment } from '../../environments/environment.prod';
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
    // Mapeamos los items al formato que nuestro backend espera
    const mappedItems = items.map((item) => ({
      product: {
        name: item.product.name,
        images: item.product.images,
        category: item.product.category,
      },
      selectedVariants: item.selectedVariants,
      quantity: item.quantity,
      price: this.calculateFinalItemPrice(item), // Calculamos el precio final por item
    }));

    return this.http.post<{ id: string }>(`${this.apiUrl}/create_preference`, {
      items: mappedItems,
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
