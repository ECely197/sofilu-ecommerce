/**
 * @fileoverview Servicio de Navegación.
 * Obtiene la estructura de navegación principal desde el backend.
 * Esta estructura se usa para construir dinámicamente el menú del header.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../interfaces/product.interface';

// --- Interfaces para el tipado de la estructura de navegación ---
export interface SubCategory {
  id: string;
  name: string;
  products: Product[]; // Productos de muestra para el mega-menú
}
export interface NavItem {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/navigation`;

  /** Obtiene la estructura de navegación completa desde la API. */
  getNavigationData(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(this.apiUrl);
  }
}
