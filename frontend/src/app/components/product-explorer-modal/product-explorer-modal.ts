// En: product-explorer-modal.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // Importa ReactiveFormsModule
import {
  ProductModalService,
  ProductModalData,
} from '../../services/product-modal.service';
import { ProductCard } from '../product-card/product-card';
import { Product } from '../../interfaces/product.interface';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-explorer-modal',
  standalone: true,
  imports: [CommonModule, ProductCard, ReactiveFormsModule],
  templateUrl: './product-explorer-modal.html',
  styleUrl: './product-explorer-modal.scss',
  animations: [
    trigger('flyInOut', [
      state('void', style({ transform: 'translateY(100%)' })),
      transition('void => *', animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('* => void', animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProductExplorerModalComponent implements OnInit {
  public productModalService = inject(ProductModalService);
  private fb = inject(FormBuilder);

  // Signal para guardar la lista original de productos
  private originalProducts = signal<Product[]>([]);

  // Signal (computado) para mostrar los productos filtrados y ordenados
  filteredProducts = computed(() => {
    const products = this.originalProducts();
    const sortValue = this.filterForm.value.sortBy;

    if (!products || !sortValue) {
      return [];
    }

    // Clonamos el array para no modificar el original
    const sortedProducts = [...products];
    const [key, order] = sortValue.split(',');

    if (key === 'relevance') {
      return sortedProducts; // No hacemos nada para "Relevancia"
    }

    sortedProducts.sort((a, b) => {
      let valA, valB;

      if (key === 'price') {
        valA = a.isOnSale ? a.salePrice! : a.price;
        valB = b.isOnSale ? b.salePrice! : b.price;
      } else {
        // Asumimos que es 'name'
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedProducts;
  });

  // FormGroup para los controles del filtro
  filterForm!: FormGroup;
  modalData = this.productModalService.modalState;

  ngOnInit(): void {
    // En ngOnInit solo inicializamos el formulario
    this.filterForm = this.fb.group({
      sortBy: ['relevance,desc'],
    });
  }
}
