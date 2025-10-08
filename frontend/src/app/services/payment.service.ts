// En: frontend/src/app/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem } from '../interfaces/cart-item.interface';

// --- ¡INTERFAZ CORRECTA! ---
// Esta interfaz define la información del pagador que espera el backend.
export interface PayerInfo {
  name: string;
  surname: string; // Es opcional, pero debe estar definido
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Pide al backend que cree una preferencia de pago en Mercado Pago.
   * @param items Los artículos del carrito, formateados para Mercado Pago.
   * @param payerInfo La información del cliente.
   * @returns Un Observable que emite un objeto con el ID de la preferencia.
   */
  createPreference(
    items: any[], // `any[]` es aceptable aquí porque es un formato específico de MP
    payerInfo: PayerInfo
  ): Observable<{ id: string }> {
    const payload = {
      items: items,
      payerInfo: payerInfo,
    };
    return this.http.post<{ id: string }>(
      `${this.apiUrl}/create_preference`,
      payload
    );
  }
}
