// En: frontend/src/app/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Pide al backend que cree una transacción en Wompi.
   * @param paymentData Los datos necesarios para la transacción.
   * @returns Un Observable con el ID de la transacción creada.
   */
  createTransaction(
    paymentData: any
  ): Observable<{ transactionId: string; reference: string }> {
    return this.http.post<{ transactionId: string; reference: string }>(
      `${this.apiUrl}/create-transaction`,
      paymentData
    );
  }

  /**
   * Pide al backend que verifique el estado final de una transacción en Wompi.
   * @param transactionId El ID de la transacción a verificar.
   * @returns Un Observable con el estado de la transacción.
   */
  verifyTransaction(
    transactionId: string
  ): Observable<{ status: string; reference: string }> {
    return this.http.get<{ status: string; reference: string }>(
      `${this.apiUrl}/verify-transaction/${transactionId}`
    );
  }
}
