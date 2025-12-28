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

  initWompiTransaction(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/init-transaction`, orderData);
  }

  checkPaymentStatus(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check-status/${orderId}`);
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-transaction`, data);
  }
}
