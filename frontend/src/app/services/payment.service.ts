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
  private isProduction = environment.production;

  /**
   * Pide al backend la firma de integridad para iniciar el checkout.
   */
  getIntegritySignature(data: {
    reference: string;
    amount_in_cents: number;
    currency: string;
  }): Observable<{ signature: string }> {
    return this.http.post<{ signature: string }>(
      `${this.apiUrl}/create-signature`,
      data
    );
  }

  /**
   * Pide al backend que verifique el estado de una transacción.
   */
  verifyTransaction(transactionId: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(
      `${this.apiUrl}/verify-transaction-status/${transactionId}`
    );
  }

  createTransaction(data: any): Observable<any> {
    // Añadir indicador de producción
    const payload = {
      ...data,
      mode: this.isProduction ? 'production' : 'test',
    };

    return this.http.post<any>(`${this.apiUrl}/create-transaction`, payload);
  }
}
