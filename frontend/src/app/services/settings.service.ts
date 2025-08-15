// Contenido completo para: frontend/src/app/services/settings.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/settings`;

  getShippingCost(): Observable<number> {
    return this.http
      .get<{ value: number }>(`${this.apiUrl}/shippingCost`)
      .pipe(map((response) => response.value));
  }

  // --- ¡NUEVO MÉTODO PARA GUARDAR! ---
  updateShippingCost(cost: number): Observable<any> {
    const url = `${this.apiUrl}/shippingCost`;
    // Enviamos una petición PUT con el nuevo valor en el cuerpo
    return this.http.put(url, { value: cost });
  }
}
