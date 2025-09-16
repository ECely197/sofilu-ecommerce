import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Componentes
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products';
import { ProductCarousel } from '../../components/home/product-carousel/product-carousel';
import { HowToBuy } from '../../components/how-to-buy/how-to-buy';

// Servicios y Tipos
import { ProductServices } from '../../services/product';
import { CategoryService, Category } from '../../services/category.service';
import { Product } from '../../interfaces/product.interface';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Estructura para agrupar productos por categoría (sin 'theme')
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
    CategoriesSection,
    FeaturedProductsComponent,
    ProductCarousel,
    HowToBuy,
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
    // Obtenemos los datos iniciales
    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));
    this.productService
      .getFeaturedProducts()
      .subscribe((prods) => this.featuredProducts.set(prods));

    // Obtenemos los productos para cada categoría
    this.categoryService
      .getCategories()
      .pipe(
        switchMap((categories) => {
          const filteredCategories = categories.filter(
            (cat) => cat.slug !== 'plumones'
          ); // Filtra categorías si es necesario
          if (filteredCategories.length === 0) {
            return of({ productArrays: [], categories: [] });
          }

          const productRequests = filteredCategories.map((cat) =>
            this.productService.getProductsByCategory(cat.slug)
          );

          return forkJoin(productRequests).pipe(
            switchMap((productArrays) =>
              of({ productArrays, categories: filteredCategories })
            )
          );
        })
      )
      .subscribe((result) => {
        const groupedProducts: ProductsByCategory[] = [];
        result.productArrays.forEach((products, index) => {
          if (products.length > 0) {
            const category = result.categories[index];
            groupedProducts.push({
              name: `Novedades en ${category.name}`,
              slug: category.slug,
              products: products,
            });
          }
        });
        this.productsByCategory.set(groupedProducts);
      });
  }
}
