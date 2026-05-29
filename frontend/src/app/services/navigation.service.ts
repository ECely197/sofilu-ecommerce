/**
 * @fileoverview Servicio de Navegación (VERSIÓN FINAL Y OPTIMIZADA).
 * Obtiene, enriquece y cachea la estructura de navegación para el mega-menú.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { switchMap, map, tap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { Product } from '../interfaces/product.interface';
import { ProductServices } from './product';

// --- Interfaces (se mantienen igual) ---
export interface SubCategory {
  id: string;
  slug: string;
  name: string;
  products: Product[];
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
  private productService = inject(ProductServices);
  private apiUrl = `${environment.apiUrl}/navigation`;

  // ✨ LA CLAVE ESTÁ AQUÍ: Un BehaviorSubject que guardará nuestros datos.
  // Empieza como 'null' para saber que aún no hemos cargado nada.
  private navDataCache$ = new BehaviorSubject<NavItem[] | null>(null);

  getNavigationData(): Observable<NavItem[]> {
    // Si ya tenemos datos en el caché (no es null), los devolvemos directamente.
    if (this.navDataCache$.getValue()) {
      return this.navDataCache$.asObservable() as Observable<NavItem[]>;
    }

    // Si es la primera vez, iniciamos el proceso de carga.
    return this.http.get<NavItem[]>(this.apiUrl).pipe(
      tap(baseNavItems => {
        this.navDataCache$.next(baseNavItems);
      })
    );
  }
}