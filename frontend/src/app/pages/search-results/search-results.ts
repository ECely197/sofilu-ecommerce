// En: search-results.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { ProductServices } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);

  products = signal<Product[]>([]);
  searchTerm = signal<string>('');
  isLoading = signal(true);

  ngOnInit(): void {
    // Nos suscribimos a los cambios en los parámetros de la URL
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.isLoading.set(true);
          const query = params.get('q') || '';
          this.searchTerm.set(query);
          // Llamamos a nuestro nuevo servicio de búsqueda
          return this.productService.searchProducts({ search: query });
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
}
