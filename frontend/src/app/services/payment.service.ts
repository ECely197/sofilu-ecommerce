import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Paso 1: Pide al backend crear la orden y firmarla.
   */
  initWompiTransaction(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/init-transaction`, orderData);
  }

  /**
   * Paso 2: Verifica el estado de una orden existente en BD.
   * Llama al endpoint que consulta directamente a Wompi si es necesario.
   */
  checkPaymentStatus(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check-status/${orderId}`);
  }

  // Métodos antiguos o auxiliares (opcional mantenerlos si los usas en otro lado)
  createTransaction(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-transaction`, data);
  }
}
