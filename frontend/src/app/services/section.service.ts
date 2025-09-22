/**
 * @fileoverview Servicio de Secciones.
 * Gestiona las operaciones CRUD para las secciones principales del sitio
 * (ej: "Hombre", "Mujer", "Niños").
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaz para el tipado fuerte de los datos de Sección.
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

  /** Obtiene todas las secciones. (Ruta Pública) */
  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(this.apiUrl);
  }

  /**
   * Crea una nueva sección. (Ruta de Admin)
   * @param sectionData Objeto que contiene el nombre de la nueva sección.
   */
  createSection(sectionData: { name: string }): Observable<Section> {
    return this.http.post<Section>(this.apiUrl, sectionData);
  }

  /**
   * Elimina una sección. (Ruta de Admin)
   * @param sectionId El ID de la sección a eliminar.
   */
  deleteSection(sectionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${sectionId}`);
  }
}
