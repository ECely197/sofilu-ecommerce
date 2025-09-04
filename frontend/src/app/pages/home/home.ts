import {
  Component,
  OnInit,
  inject,
  signal,
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChildren,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Componentes
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products';
import { ProductCarousel } from '../../components/home/product-carousel/product-carousel';
import { HowToBuy } from '../../components/how-to-buy/how-to-buy';
import { SaleSection } from '../../components/sale-section/sale-section';

// Servicios y Tipos
import { ProductServices } from '../../services/product';
import { CategoryService, Category } from '../../services/category.service';
import { Product } from '../../interfaces/product.interface';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Estructura para agrupar productos por categoría
interface ProductsByCategory {
  name: string;
  slug: string;
  products: Product[];
  theme: string; // El tema de color para el fondo
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoriesSection,
    FeaturedProductsComponent,
    ProductCarousel,
    HowToBuy,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductServices);
  private categoryService = inject(CategoryService);

  // Signals para los datos
  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  productsByCategory = signal<ProductsByCategory[]>([]);

  // Referencia a todos los elementos de sección en la plantilla
  @ViewChildren('sectionCard', { read: ElementRef })
  sectionCards!: QueryList<ElementRef>;
  private observer!: IntersectionObserver;

  ngOnInit() {
    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));
    this.productService
      .getFeaturedProducts()
      .subscribe((prods) => this.featuredProducts.set(prods));

    this.categoryService
      .getCategories()
      .pipe(
        switchMap((categories) => {
          const filteredCategories = categories.filter(
            (cat) => cat.slug !== 'plumones'
          );
          if (filteredCategories.length === 0) {
            // Devolvemos un observable que emite un objeto con arrays vacíos
            return of({ productArrays: [], categories: [] });
          }

          const productRequests = filteredCategories.map((cat) =>
            this.productService.getProductsByCategory(cat.slug)
          );

          // ¡TIPADO EXPLÍCITO AQUÍ!
          // Le decimos a TypeScript lo que forkJoin va a devolver.
          const joinedRequests$: Observable<{
            productArrays: Product[][];
            categories: Category[];
          }> = forkJoin(productRequests).pipe(
            switchMap((productArrays) =>
              of({ productArrays, categories: filteredCategories })
            )
          );
          return joinedRequests$;
        })
      )
      .subscribe((result) => {
        // 'result' es ahora de tipo { productArrays: Product[][]; categories: Category[] }
        const groupedProducts: ProductsByCategory[] = [];
        const themes = [
          'theme-pijamas',
          'theme-sabanas',
          'theme-categories',
          'theme-featured',
        ];

        // Ahora TypeScript sabe que 'result.productArrays' existe y es un array
        result.productArrays.forEach((products: Product[], index: number) => {
          // <-- Tipado explícito aquí también
          if (products.length > 0) {
            const category = result.categories[index]; // Y 'result.categories' también existe
            groupedProducts.push({
              name: `Novedades en ${category.name}`,
              slug: category.slug,
              products: products,
              theme: themes[index % themes.length],
            });
          }
        });
        this.productsByCategory.set(groupedProducts);

        setTimeout(() => this.setupIntersectionObserver(), 0);
      });
  }

  ngAfterViewInit() {
    // La suscripción a los cambios manejará las actualizaciones
    this.sectionCards.changes.subscribe(() => {
      this.setupIntersectionObserver();
    });
  }

  ngOnDestroy() {
    // Es una buena práctica desconectar el observador al destruir el componente
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupIntersectionObserver() {
    if (this.observer) this.observer.disconnect();

    const options = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const theme = entry.target.getAttribute('data-theme');
          document.body.className = theme || 'theme-default';
        }
      });
    }, options);

    this.sectionCards.forEach((card) =>
      this.observer.observe(card.nativeElement)
    );
  }
}
