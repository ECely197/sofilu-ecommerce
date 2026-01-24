import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

// Interfaz para tipado fuerte
export interface DeliveryOption {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryOptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/delivery-options`;

  // Para el checkout (solo activas)
  getActiveOptions(): Observable<DeliveryOption[]> {
    return this.http.get<DeliveryOption[]>(this.apiUrl);
  }

  // Para el admin (todas)
  getAllOptions(): Observable<DeliveryOption[]> {
    return this.http.get<DeliveryOption[]>(`${this.apiUrl}/all`);
  }

  createOption(data: Partial<DeliveryOption>): Observable<DeliveryOption> {
    return this.http.post<DeliveryOption>(this.apiUrl, data);
  }

  updateOption(
    id: string,
    data: Partial<DeliveryOption>,
  ): Observable<DeliveryOption> {
    return this.http.put<DeliveryOption>(`${this.apiUrl}/${id}`, data);
  }

  deleteOption(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
