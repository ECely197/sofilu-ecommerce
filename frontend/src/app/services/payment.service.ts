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
   * Envía los datos de la orden al backend para que:
   * 1. Guarde la orden en BD.
   * 2. Calcule la firma de integridad SHA-256.
   * Retorna los datos necesarios para abrir el Widget.
   */
  initWompiTransaction(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/init-transaction`, orderData);
  }

  /**
   * (Opcional) Verifica manualmente una transacción
   */
  verifyTransaction(transactionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify/${transactionId}`);
  }
}
