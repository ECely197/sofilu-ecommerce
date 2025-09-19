// Contenido para: frontend/src/app/services/category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Section } from './section.service';

// Opcional: Crear una interfaz para tipado fuerte
export interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
  section: string | Section;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

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

  // Obtener todas las categorías
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  // Obtener una categoría por su ID (para el formulario de edición)
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/id/${id}`);
  }

  // Crear una nueva categoría
  createCategory(categoryData: {
    name: string;
    imageUrl: string;
    section: string;
  }): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, categoryData);
  }

  // Actualizar una categoría
  updateCategory(
    id: string,
    categoryData: { name: string; imageUrl: string; section: string }
  ): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, categoryData);
  }

  // Eliminar una categoría
  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
