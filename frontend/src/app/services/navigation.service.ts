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

  /**
   * Obtiene la estructura de navegación.
   * Si ya está en caché, la devuelve. Si no, la busca, la enriquece y la cachea.
   */
  getNavigationData(): Observable<NavItem[]> {
    // Si ya tenemos datos en el caché (no es null), los devolvemos directamente.
    if (this.navDataCache$.getValue()) {
      return this.navDataCache$.asObservable() as Observable<NavItem[]>;
    }

    // Si es la primera vez, iniciamos el proceso de carga y enriquecimiento.
    return this.http.get<NavItem[]>(this.apiUrl).pipe(
      switchMap(baseNavItems => {
        if (!baseNavItems || baseNavItems.length === 0) {
          return of([]); // No hay nada que enriquecer.
        }

        const subCategoryTasks$: Observable<SubCategory>[] = [];
        baseNavItems.forEach(item => {
          item.subCategories.forEach(sub => {
            const task = this.productService.getProductsByCategory(sub.slug).pipe(
              map(products => ({
                ...sub,
                products: products.slice(0, 3)
              }))
            );
            subCategoryTasks$.push(task);
          });
        });

        // Si no hay subcategorías en total, tampoco hay tareas.
        if (subCategoryTasks$.length === 0) {
          return of(baseNavItems);
        }

        return forkJoin(subCategoryTasks$).pipe(
          map(enrichedSubs => {
            // Reconstruimos la navegación con las subcategorías que ahora tienen productos.
            return baseNavItems.map(item => ({
              ...item,
              subCategories: item.subCategories.map(originalSub => 
                enrichedSubs.find(enriched => enriched.id === originalSub.id) || originalSub
              )
            }));
          })
        );
      }),
      // 'tap' nos permite hacer una acción "de lado" sin alterar los datos.
      // Aquí es donde guardamos el resultado final en nuestro caché.
      tap(enrichedNav => {
        this.navDataCache$.next(enrichedNav);
      })
    );
  }
}