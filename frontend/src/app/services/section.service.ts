// En: frontend/src/app/services/section.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaz para el tipado
export interface Section {
  _id: string;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sections`;

  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(this.apiUrl);
  }

  createSection(sectionData: { name: string }): Observable<Section> {
    return this.http.post<Section>(this.apiUrl, sectionData);
  }

  deleteSection(sectionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${sectionId}`);
  }
}
