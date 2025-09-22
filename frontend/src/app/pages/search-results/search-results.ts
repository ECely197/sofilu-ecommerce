/**
 * @fileoverview Componente de la Página de Resultados de Búsqueda.
 * Muestra una lista de productos basada en los parámetros de búsqueda y filtros
 * obtenidos de la URL. Reacciona dinámicamente a los cambios en estos parámetros.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { ProductServices } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card';
import { switchMap } from 'rxjs';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard, RippleDirective],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResultsComponent implements OnInit {
  // --- Inyección de Dependencias ---
  private route = inject(ActivatedRoute); // Para leer parámetros de la URL actual
  private router = inject(Router); // Para navegar y modificar la URL
  private productService = inject(ProductServices);

  // --- Estado del Componente con Signals ---
  products = signal<Product[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal(true);
  activeFilters = signal<{ [key: string]: string }>({});

  ngOnInit(): void {
    // --- Lógica Reactiva a los Cambios de URL ---
    this.route.queryParamMap
      .pipe(
        // `switchMap` cancela la petición de búsqueda anterior si llega una nueva,
        // evitando condiciones de carrera.
        switchMap((params) => {
          this.isLoading.set(true);

          // Construye un objeto con todos los filtros activos desde la URL
          const currentFilters: { [key: string]: string } = {};
          params.keys.forEach((key) => {
            currentFilters[key] = params.get(key)!;
          });

          const query = params.get('q') || '';
          this.searchTerm.set(query);
          this.activeFilters.set(currentFilters); // Actualiza el signal de filtros

          // Prepara los parámetros para la llamada a la API
          const apiParams = { ...currentFilters };
          if (apiParams['q']) {
            apiParams['search'] = apiParams['q']; // Renombra 'q' a 'search' para el backend
            delete apiParams['q'];
          }

          // Llama al servicio con todos los filtros
          return this.productService.searchProducts(apiParams);
        })
      )
      .subscribe({
        next: (results) => {
          this.products.set(results);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error en la búsqueda:', err);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Aplica un nuevo filtro de ordenamiento modificando los parámetros de la URL.
   * El `ngOnInit` reaccionará automáticamente a este cambio de URL.
   * @param event El evento `change` del elemento <select>.
   */
  applySort(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const [sortBy, sortOrder] = selectElement.value.split(',');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy, sortOrder },
      queryParamsHandling: 'merge', // 'merge' conserva los otros filtros existentes en la URL
    });
  }
}
