import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { ProductServices } from '../../services/product';
import { CategoryService, Category } from '../../services/category.service';
import { ProductCard } from '../../components/product-card/product-card';
import { combineLatest } from 'rxjs';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, ProductCard, RippleDirective],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductServices);
  private categoryService = inject(CategoryService);

  // --- Estado ---
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(true);

  // Filtros activos
  searchTerm = signal<string>('');
  activeCategorySlug = signal<string | null>(null);

  // UI State para los dropdowns
  showCategoryFilter = signal(false);
  showSortFilter = signal(false);

  // Computed para mostrar nombre bonito de la categoría
  activeCategoryName = computed(() => {
    const slug = this.activeCategorySlug();
    if (!slug) return null;
    const cat = this.categories().find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  });

  ngOnInit(): void {
    // 1. Cargar Categorías y Parámetros URL en paralelo
    combineLatest([
      this.categoryService.getCategories(),
      this.route.queryParamMap,
    ]).subscribe({
      next: ([categoriesData, params]) => {
        this.categories.set(categoriesData);
        this.isLoading.set(true);

        // Extraer filtros de la URL
        const query = params.get('q') || '';
        const catSlug = params.get('category') || null;
        const sortBy = params.get('sortBy');
        const sortOrder = params.get('sortOrder');

        this.searchTerm.set(query);
        this.activeCategorySlug.set(catSlug);

        // --- LA CORRECCIÓN MÁGICA: SLUG -> ID ---
        let categoryId = null;
        if (catSlug) {
          const matchedCat = categoriesData.find((c) => c.slug === catSlug);
          categoryId = matchedCat ? matchedCat._id : null;
        }

        // Construir Payload para Backend
        const apiParams: any = {};

        if (query) apiParams['search'] = query;
        if (categoryId) apiParams['category'] = categoryId; // ¡Enviamos el ID, no el slug!
        if (sortBy) apiParams['sortBy'] = sortBy;
        if (sortOrder) apiParams['sortOrder'] = sortOrder;

        // Llamar a la API
        this.searchProducts(apiParams);
      },
      error: (err) => {
        console.error('Error inicializando búsqueda:', err);
        this.isLoading.set(false);
      },
    });
  }

  private searchProducts(params: any) {
    this.productService.searchProducts(params).subscribe({
      next: (res) => {
        this.products.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error buscando productos:', err);
        this.products.set([]); // Limpiar en caso de error
        this.isLoading.set(false);
      },
    });
  }

  // --- MÉTODOS DE UI ---

  toggleCategoryFilter() {
    this.showCategoryFilter.update((v) => !v);
    this.showSortFilter.set(false);
  }

  toggleSortFilter() {
    this.showSortFilter.update((v) => !v);
    this.showCategoryFilter.set(false);
  }

  selectCategory(slug: string | null) {
    this.showCategoryFilter.set(false);
    this.updateParams({ category: slug, q: null }); // Al filtrar por categoría, limpiamos la búsqueda de texto
  }

  applySort(sortValue: string) {
    const [sortBy, sortOrder] = sortValue.split(',');
    this.showSortFilter.set(false);
    this.updateParams({ sortBy, sortOrder });
  }

  removeFilter(type: 'search' | 'category') {
    if (type === 'search') this.updateParams({ q: null });
    if (type === 'category') this.updateParams({ category: null });
  }

  private updateParams(newParams: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge', // Mantiene los otros filtros
    });
  }
}
