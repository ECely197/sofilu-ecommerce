// En: frontend/src/app/pages/search-results/search-results.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { ProductServices } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card';
import { switchMap } from 'rxjs';
import { RippleDirective } from '../../directives/ripple'; // <-- Importa Ripple

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard, RippleDirective], // <-- Añade RippleDirective
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);

  products = signal<Product[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal(true);

  // ¡NUEVO! Signal para el estado de los filtros
  activeFilters = signal<{ [key: string]: string }>({});

  ngOnInit(): void {
    // Escuchamos CUALQUIER cambio en los parámetros de la URL
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.isLoading.set(true);

          // Construimos un objeto con todos los filtros activos desde la URL
          const currentFilters: { [key: string]: string } = {};
          params.keys.forEach((key) => {
            currentFilters[key] = params.get(key)!;
          });

          const query = params.get('q') || '';
          this.searchTerm.set(query);
          this.activeFilters.set(currentFilters); // Actualizamos el signal de filtros

          // Renombramos 'q' a 'search' para que coincida con la API
          const apiParams = { ...currentFilters };
          if (apiParams['q']) {
            apiParams['search'] = apiParams['q'];
            delete apiParams['q'];
          }

          // Llamamos al servicio con todos los filtros
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

  // ¡NUEVO! Método para aplicar un filtro
  applyFilter(key: string, value: string): void {
    // Actualizamos los queryParams de la URL.
    // 'merge' mantiene los existentes, 'null' elimina el filtro si el valor es nulo.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value },
      queryParamsHandling: 'merge',
    });
  }

  // ¡NUEVO! Método para aplicar el ordenamiento
  applySort(event: Event): void {
    // 1. Le decimos a TypeScript que el 'target' es un elemento HTML de tipo <select>
    const selectElement = event.target as HTMLSelectElement;
    // 2. Ahora podemos acceder a '.value' de forma segura
    const sortValue = selectElement.value;

    const [sortBy, sortOrder] = sortValue.split(',');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy, sortOrder },
      queryParamsHandling: 'merge',
    });
  }
}
