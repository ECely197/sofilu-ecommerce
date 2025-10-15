// En: frontend/src/app/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Pide al backend que genere la firma de integridad para una transacción.
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
}
