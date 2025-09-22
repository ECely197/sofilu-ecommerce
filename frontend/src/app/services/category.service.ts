/**
 * @fileoverview Servicio de Categorías.
 * Proporciona métodos para interactuar con los endpoints de la API
 * relacionados con las categorías de productos.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Section } from './section.service';

// Interfaz para el tipado fuerte de los datos de Categoría.
export interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
  section: string | Section; // Puede ser un ID o el objeto Section populado.
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  /**
   * Busca categorías en el backend utilizando parámetros de consulta.
   * @param queryParams Un objeto clave-valor con los filtros a aplicar.
   */
  searchCategories(queryParams: {
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

  /** Obtiene todas las categorías. */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  /** Obtiene una categoría específica por su ID. */
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/id/${id}`);
  }

  /**
   * Crea una nueva categoría.
   * @param categoryData Objeto con los datos de la nueva categoría.
   */
  createCategory(categoryData: {
    name: string;
    imageUrl: string;
    section: string;
  }): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, categoryData);
  }

  /**
   * Actualiza una categoría existente.
   * @param id El ID de la categoría a actualizar.
   * @param categoryData Objeto con los nuevos datos de la categoría.
   */
  updateCategory(
    id: string,
    categoryData: { name: string; imageUrl: string; section: string }
  ): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, categoryData);
  }

  /**
   * Elimina una categoría.
   * @param id El ID de la categoría a eliminar.
   */
  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
