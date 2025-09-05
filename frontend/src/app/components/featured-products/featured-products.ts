import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { ProductCard } from '../product-card/product-card';
import {
  trigger,
  transition,
  query,
  stagger,
  style,
  animate,
} from '@angular/animations';
import { ProductModalService } from '../../services/product-modal.service';
import { ProductServices } from '../../services/product';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './featured-products.html',
  styleUrl: './featured-products.scss',
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query(
          'app-product-card',
          [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
              animate(
                '0.6s cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class FeaturedProductsComponent {
  private productModalService = inject(ProductModalService);

  // 1. Signal privado para almacenar la lista COMPLETA de productos
  private allProducts = signal<Product[]>([]);

  // 2. Usamos el 'setter' del @Input para actualizar nuestro signal interno
  @Input()
  set products(incomingProducts: Product[]) {
    this.allProducts.set(incomingProducts);
  }

  // 3. Este computed signal ahora SÍ REACCIONA a los cambios en 'allProducts'
  productsToShow = computed(() => this.allProducts().slice(0, 4));

  // 4. Este computed también es reactivo
  hasMoreProducts = computed(() => this.allProducts().length > 0); // Lo cambiamos para que siempre muestre el botón

  openExplorer(): void {
    this.productModalService.open({
      title: 'Nuestros Favoritos',
      products: this.products,
    });
  }
}
