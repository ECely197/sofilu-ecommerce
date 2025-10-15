import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Pide al backend que cree un checkout en Wompi.
   */
  createCheckout(paymentData: any): Observable<{ checkoutId: string }> {
    return this.http.post<{ checkoutId: string }>(
      `${this.apiUrl}/create-transaction`,
      paymentData
    );
  }

  /**
   * ¡MÉTODO RESTAURADO!
   * Pide al backend que verifique el estado final de una transacción.
   */
  verifyTransaction(
    transactionId: string
  ): Observable<{ status: string; reference: string }> {
    return this.http.get<{ status: string; reference: string }>(
      `${this.apiUrl}/verify-transaction/${transactionId}`
    );
  }
}
