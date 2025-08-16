import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOrderById(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }
  updateOrderStatus(orderId: string, newStatus: string): Observable<any> {
    const url = `${this.apiUrl}/${orderId}/status`;
    const body = { status: newStatus };
    // Hacemos una petición PUT, enviando el nuevo estado en el cuerpo
    return this.http.put<any>(url, body);
  }
  createOrder(orderData: any): Observable<any> {
    // Hacemos una petición POST, enviando los datos del cliente y los ítems.
    return this.http.post<any>(this.apiUrl, orderData);
  }

  deleteOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${orderId}`);
  }

  getOrdersForUser(userId: string): Observable<any[]> {
    console.log('ORDER SERVICE: Haciendo petición a la URL:');
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getOrderInvoice(orderId: string): Observable<Blob> {
    const url = `${this.apiUrl}/${orderId}/invoice`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
