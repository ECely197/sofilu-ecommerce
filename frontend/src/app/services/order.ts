/**
 * @fileoverview Servicio de Pedidos.
 * Centraliza toda la comunicación con la API para la gestión de pedidos,
 * tanto para clientes como para administradores.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  /**
   * Busca pedidos en el backend utilizando parámetros de consulta.
   * @param queryParams Un objeto clave-valor con los filtros a aplicar.
   */
  searchOrders(queryParams: {
    [param: string]: string | number | boolean;
  }): Observable<any[]> {
    let params = new HttpParams();
    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        params = params.set(key, queryParams[key]);
      }
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  /** Obtiene todos los pedidos (usado principalmente por el admin). */
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /** Obtiene un pedido único por su ID. */
  getOrderById(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }

  /**
   * Actualiza el estado de un pedido.
   * @param orderId El ID del pedido a actualizar.
   * @param newStatus El nuevo estado (ej: "Enviado").
   */
  updateOrderStatus(orderId: string, newStatus: string): Observable<any> {
    const url = `${this.apiUrl}/${orderId}/status`;
    const body = { status: newStatus };
    return this.http.put<any>(url, body);
  }

  /** Crea un nuevo pedido con los datos proporcionados. */
  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderData);
  }

  /** Elimina un pedido del sistema. */
  deleteOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${orderId}`);
  }

  /** Obtiene el historial de pedidos para un usuario específico. */
  getOrdersForUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  /** Obtiene la factura de un pedido en formato de archivo (Blob). */
  getOrderInvoice(orderId: string): Observable<Blob> {
    const url = `${this.apiUrl}/${orderId}/invoice`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /** Obtiene las estadísticas clave para el dashboard de administración. */
  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary/stats`);
  }

  /**
   * Permite a un cliente editar los artículos de un pedido en estado "Procesando".
   * @param orderId El ID del pedido a editar.
   * @param newItems El nuevo array de artículos del pedido.
   */
  editOrder(orderId: string, newItems: any[]): Observable<any> {
    const url = `${this.apiUrl}/${orderId}`;
    return this.http.put<any>(url, { items: newItems });
  }
}
