// En: frontend/src/app/pages/home/home.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Componentes de las secciones
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products';
import { ProductCarousel } from '../../components/home/product-carousel/product-carousel'; // ¡Importamos el nuevo componente!

// Servicios y Tipos
import { ProductServices } from '../../services/product';
import { CategoryService, Category } from '../../services/category.service';
import { Product } from '../../interfaces/product.interface';
import { forkJoin } from 'rxjs';

// Estructura para agrupar productos por categoría
interface ProductsByCategory {
  name: string;
  slug: string;
  products: Product[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoriesSection,
    FeaturedProductsComponent,
    ProductCarousel, // ¡Añadimos el nuevo componente!
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private productService = inject(ProductServices);
  private categoryService = inject(CategoryService);

  // Signals para los datos
  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  productsByCategory = signal<ProductsByCategory[]>([]);

  ngOnInit() {
    // Obtenemos las categorías y los productos destacados
    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));
    this.productService
      .getFeaturedProducts()
      .subscribe((prods) => this.featuredProducts.set(prods));

    // Obtenemos los productos para cada categoría (excluyendo "Plumones" o sin productos)
    this.categoryService.getCategories().subscribe((categories) => {
      const productRequests = categories
        .filter((cat) => cat.slug !== 'plumones') // Excluimos categorías si es necesario
        .map((cat) => this.productService.getProductsByCategory(cat.slug));

      forkJoin(productRequests).subscribe((productArrays) => {
        const groupedProducts: ProductsByCategory[] = [];
        productArrays.forEach((products, index) => {
          if (products.length > 0) {
            const category = categories.filter(
              (cat) => cat.slug !== 'plumones'
            )[index];
            groupedProducts.push({
              name: `Novedades en ${category.name}`, // Título de la sección
              slug: category.slug,
              products: products,
            });
          }
        });
        this.productsByCategory.set(groupedProducts);
      });
    });
  }
}
