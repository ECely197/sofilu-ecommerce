// En: frontend/src/app/services/special-event.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Product } from '../interfaces/product.interface';

export interface SpecialEvent {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  isActive: boolean;
  linkedProducts: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class SpecialEventService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/special-events`;

  // --- RUTA PÚBLICA ---
  getActiveEvents(): Observable<SpecialEvent[]> {
    return this.http.get<SpecialEvent[]>(`${this.apiUrl}/active`);
  }

  // --- RUTAS DE ADMIN ---
  getEvents(): Observable<SpecialEvent[]> {
    return this.http.get<SpecialEvent[]>(this.apiUrl);
  }

  createEvent(eventData: FormData): Observable<SpecialEvent> {
    return this.http.post<SpecialEvent>(this.apiUrl, eventData);
  }

  updateEvent(id: string, eventData: FormData): Observable<SpecialEvent> {
    return this.http.put<SpecialEvent>(`${this.apiUrl}/${id}`, eventData);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Ruta especial para activar un evento (y desactivar los demás)
  toggleActive(id: string): Observable<SpecialEvent[]> {
    return this.http.patch<SpecialEvent[]>(
      `${this.apiUrl}/${id}/toggle-active`,
      {},
    );
  }
}
