import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WarrantyType {
  _id: string;
  name: string; // ej: "6 Meses"
  durationMonths: number; // ej: 6
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/warranty-types`;

  getWarranties(): Observable<WarrantyType[]> {
    return this.http.get<WarrantyType[]>(this.apiUrl);
  }

  createWarranty(data: Partial<WarrantyType>): Observable<WarrantyType> {
    return this.http.post<WarrantyType>(this.apiUrl, data);
  }

  updateWarranty(
    id: string,
    data: Partial<WarrantyType>,
  ): Observable<WarrantyType> {
    return this.http.put<WarrantyType>(`${this.apiUrl}/${id}`, data);
  }

  deleteWarranty(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
