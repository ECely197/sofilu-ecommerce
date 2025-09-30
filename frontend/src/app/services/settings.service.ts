/**
 * @fileoverview Servicio de Configuración.
 * Permite obtener y actualizar configuraciones globales de la aplicación,
 * como el costo de envío.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

export interface AppSettings {
  _id?: string;
  storeName: string;
  storeLogoUrl: string;
  contactEmail: string;
  shippingCostBogota: number;
  shippingCostNational: number;
  serviceFeePercentage: number;
  socialLinks: { platform: string; url: string }[];
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/settings`;

  /** Obtiene todas las configuraciones de la tienda. */
  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.apiUrl);
  }

  /** Actualiza todas las configuraciones de la tienda. */
  updateSettings(settingsData: Partial<AppSettings>): Observable<AppSettings> {
    return this.http.put<AppSettings>(this.apiUrl, settingsData);
  }
}
