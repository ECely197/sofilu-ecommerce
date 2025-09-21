import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ProductModalService } from '../../services/product-modal.service';
import { ProductCard } from '../product-card/product-card';
import { Product, Variant } from '../../interfaces/product.interface';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-product-explorer-modal',
  standalone: true,
  imports: [CommonModule, ProductCard, ReactiveFormsModule],
  templateUrl: './product-explorer-modal.html',
  styleUrl: './product-explorer-modal.scss',
  animations: [
    trigger('flyInOut', [
      state('void', style({ transform: 'translateY(100%)', opacity: 0 })),
      transition(
        'void => *',
        animate(
          '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ),
      transition(
        '* => void',
        animate(
          '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({ transform: 'translateY(100%)', opacity: 0 })
        )
      ),
    ]),
  ],
})
export class ProductExplorerModalComponent implements OnInit {
  public productModalService = inject(ProductModalService);
  private fb = inject(FormBuilder);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private originalTitle: string = '';

  private originalProducts = signal<Product[]>([]);
  availableFilters = signal<Variant[]>([]);
  filterForm: FormGroup;

  // --- ¡LÓGICA DE FILTRADO Y ORDENAMIENTO REFINADA! ---
  filteredProducts = computed(() => {
    let products = [...this.originalProducts()];
    const filters = this.filterForm.value;

    // 1. Filtrar por variantes (Color, Tamaño, etc.)
    for (const filterKey in filters) {
      if (
        filterKey !== 'sortBy' &&
        filters[filterKey] &&
        filters[filterKey] !== 'all'
      ) {
        const filterValue = filters[filterKey];
        products = products.filter((product) =>
          product.variants.some(
            (variant) =>
              variant.name === filterKey &&
              variant.options.some((option) => option.name === filterValue)
          )
        );
      }
    }

    // 2. Ordenar
    const [sortKey, sortOrder] = (filters.sortBy || 'relevance,desc').split(
      ','
    );
    if (sortKey !== 'relevance') {
      products.sort((a, b) => {
        const valA =
          sortKey === 'price'
            ? a.isOnSale && a.salePrice
              ? a.salePrice
              : a.price
            : a.name.toLowerCase();
        const valB =
          sortKey === 'price'
            ? b.isOnSale && b.salePrice
              ? b.salePrice
              : b.price
            : b.name.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return products;
  });

  constructor() {
    this.filterForm = this.fb.group({ sortBy: ['relevance,desc'] });

    // --- EFFECT PARA MANEJAR LA APERTURA Y CIERRE DEL MODAL ---
    effect(() => {
      const data = this.productModalService.modalState();

      if (data && data.products) {
        // --- LÓGICA DE SEO AL ABRIR ---
        this.originalTitle = this.titleService.getTitle(); // Guardamos el título actual
        const newTitle = `Sofilu | ${data.title}`;
        this.titleService.setTitle(newTitle);
        this.metaService.updateTag({
          name: 'description',
          content: `Explora nuestra colección de ${data.title} en Sofilu. Calidad y confort para tu hogar.`,
        });

        // Lógica de datos (sin cambios)
        this.originalProducts.set(data.products);
        this.generateFiltersFromProducts(data.products);
      } else {
        // --- LÓGICA DE SEO AL CERRAR ---
        // Si hay un título original guardado, lo restauramos
        if (this.originalTitle) {
          this.titleService.setTitle(this.originalTitle);
          // (Opcional) Restaurar la meta descripción a una genérica
          this.metaService.updateTag({
            name: 'description',
            content: 'Sofilu - Tu universo de confort te espera.',
          });
        }

        // Lógica de datos (sin cambios)
        this.originalProducts.set([]);
        this.availableFilters.set([]);
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.originalTitle) {
      this.titleService.setTitle(this.originalTitle);
    }
  }

  // --- ¡FUNCIÓN 'generateFiltersFromProducts' CORREGIDA! ---
  private generateFiltersFromProducts(products: Product[]): void {
    const filtersMap = new Map<string, Set<string>>();

    // 1. Recopilamos todas las variantes y opciones únicas de la lista de productos
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        if (!filtersMap.has(variant.name)) {
          filtersMap.set(variant.name, new Set());
        }
        variant.options.forEach((option) =>
          filtersMap.get(variant.name)!.add(option.name)
        );
      });
    });

    // 2. Creamos la estructura de datos para la plantilla (HTML)
    const newFilters: Variant[] = [];
    filtersMap.forEach((optionsSet, name) => {
      newFilters.push({
        name,
        options: Array.from(optionsSet)
          .sort()
          .map((optName) => ({ name: optName, stock: 0, price: 0 })),
      });
    });
    this.availableFilters.set(newFilters);

    // 3. Reconstruimos el FormGroup CON LOS CONTROLES CORRECTOS
    const newFormControls: { [key: string]: any } = {
      sortBy: 'relevance,desc',
    };
    newFilters.forEach((filter) => {
      // El nombre del control (ej: 'Tamaño') ahora coincide con 'filter.name'
      newFormControls[filter.name] = 'all';
    });

    // Si el FormGroup ya existe, lo actualizamos. Si no, lo creamos.
    if (this.filterForm) {
      this.filterForm = this.fb.group(newFormControls);
    } else {
      this.filterForm = this.fb.group(newFormControls);
    }
  }
}
