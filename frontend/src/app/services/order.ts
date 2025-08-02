import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Necesitaremos una interfaz para Order en el futuro, por ahora usamos 'any'

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/orders';

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
}