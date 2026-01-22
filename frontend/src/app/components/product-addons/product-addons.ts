import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductServices } from '../../services/product';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../interfaces/product.interface';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-product-addons',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './product-addons.html',
  styleUrl: './product-addons.scss',
})
export class ProductAddonsComponent implements OnInit {
  private productService = inject(ProductServices);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  // El slug de la categoría que contiene los complementos
  // IMPORTANTE: Asegúrate de crear esta categoría en tu Admin
  private readonly ADDON_CATEGORY_SLUG = 'complementos';

  addons = signal<Product[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchAddons();
  }

  fetchAddons() {
    this.productService
      .getProductsByCategory(this.ADDON_CATEGORY_SLUG)
      .subscribe({
        next: (products) => {
          this.addons.set(products);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando complementos:', err);
          this.isLoading.set(false);
        },
      });
  }

  addToCart(product: Product) {
    // Lógica simplificada para añadir complementos
    // Asumimos que los complementos suelen tener una variante por defecto o ninguna
    const defaultVariants: { [key: string]: string } = {};

    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (v.options.length > 0) {
          defaultVariants[v.name] = v.options[0].name;
        }
      });
    }

    this.cartService.addItem(product, defaultVariants, 1);
    this.toastService.show(`+ ${product.name} añadido`, 'success');
  }
}
