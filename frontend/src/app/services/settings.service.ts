/**
 * @fileoverview Servicio de Configuración.
 * Permite obtener y actualizar configuraciones globales de la aplicación,
 * como el costo de envío.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/settings`;

  /** Obtiene el costo de envío actual desde el backend. */
  getShippingCost(): Observable<number> {
    return this.http
      .get<{ value: number }>(`${this.apiUrl}/shippingCost`)
      .pipe(map((response) => response.value)); // Extrae solo el valor numérico de la respuesta.
  }

  /**
   * Actualiza el costo de envío en el backend.
   * @param cost El nuevo costo de envío.
   */
  updateShippingCost(cost: number): Observable<any> {
    const url = `${this.apiUrl}/shippingCost`;
    // Envía una petición PUT con el nuevo valor en el cuerpo del request.
    return this.http.put(url, { value: cost });
  }
}
