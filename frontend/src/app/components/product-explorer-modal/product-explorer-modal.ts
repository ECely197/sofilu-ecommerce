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

  private originalProducts = signal<Product[]>([]);
  availableFilters = signal<Variant[]>([]);
  filterForm!: FormGroup;

  filteredProducts = computed(() => {
    let products = [...this.originalProducts()];
    if (!this.filterForm || !this.filterForm.value) return products;
    const filters = this.filterForm.value;

    // 1. Aplicar Filtros de Variantes
    for (const key in filters) {
      if (key !== 'sortBy' && filters[key] && filters[key] !== 'all') {
        products = products.filter((p) =>
          p.variants.some(
            (v) =>
              v.name === key && v.options.some((o) => o.name === filters[key])
          )
        );
      }
    }

    // 2. Aplicar Ordenamiento
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

    effect(() => {
      const data = this.productModalService.modalState();
      if (data) {
        this.originalProducts.set(data.products);
        this.generateFiltersFromProducts(data.products);
      } else {
        this.originalProducts.set([]);
        this.availableFilters.set([]);
      }
    });
  }

  // ngOnInit no es estrictamente necesario, pero es buena práctica tenerlo
  ngOnInit(): void {}

  private generateFiltersFromProducts(products: Product[]): void {
    const filtersMap = new Map<string, Set<string>>();
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        if (!filtersMap.has(variant.name)) {
          filtersMap.set(variant.name, new Set());
        }
        const optionsSet = filtersMap.get(variant.name)!;
        variant.options.forEach((option) => optionsSet.add(option.name));
      });
    });

    const newFilters: Variant[] = [];
    filtersMap.forEach((optionsSet, name) => {
      newFilters.push({
        name,
        options: Array.from(optionsSet)
          .sort()
          .map((optName) => ({ name: optName, stock: 0, priceModifier: 0 })),
      });
    });
    this.availableFilters.set(newFilters);

    // Reconstruimos el FormGroup con los nuevos filtros
    const newFormControls: { [key: string]: any } = {
      sortBy: 'relevance,desc',
    };
    newFilters.forEach((filter) => {
      newFormControls[filter.name] = 'all';
    });
    this.filterForm = this.fb.group(newFormControls);
  }
}
