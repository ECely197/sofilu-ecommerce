// Contenido completo para: src/app/pages/category-view/category-view.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { Product } from '../../interfaces/product.interface';
import { ProductServices } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card'; // ¡Importamos la tarjeta!

@Component({
  selector: 'app-category-view',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard], // ¡Añadimos ProductCard!
  templateUrl: './category-view.html',
  styleUrl: './category-view.scss',
})
export class CategoryView implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);

  products = signal<Product[]>([]);
  categoryName = signal<string>('');
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading.set(true);
          const slug = params.get('slug');
          if (!slug) {
            // Si no hay slug, devolvemos una lista vacía
            this.products.set([]);
            this.categoryName.set('Categoría no encontrada');
            this.isLoading.set(false);
            return []; // Observable vacío
          }
          // Capitalizamos el slug para mostrarlo como título temporalmente
          const formattedName = slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
          this.categoryName.set(formattedName);

          // Llamamos al servicio para obtener los productos de esta categoría
          return this.productService.getProductsByCategory(slug);
        })
      )
      .subscribe({
        next: (data) => {
          this.products.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al obtener productos por categoría:', err);
          this.isLoading.set(false);
        },
      });
  }
}
