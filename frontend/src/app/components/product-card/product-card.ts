import {
  Component,
  Input,
  inject,
  ElementRef,
  HostListener,
  computed,
} from '@angular/core';
import { Product, Option, Variant } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product!: Product;

  private el = inject(ElementRef);
  public authService = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);

  isProductInWishlist = computed(() =>
    this.wishlistService.wishlistProductIds().includes(this.product._id)
  );

  get displayPrice(): number {
    if (!this.product) return 0;
    if (this.product.isOnSale && this.product.salePrice) {
      return this.product.salePrice;
    }
    return this.product.price;
  }
  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.product) return;

    // Simplemente llamamos al método 'toggle' del servicio
    this.wishlistService.toggleProduct(this.product);
  }

  isOutOfStock = computed(() => {
    const p = this.product;
    if (!p) return true;

    if (p.status === 'Agotado') {
      return true;
    }

    if (p.variants && p.variants.length > 0) {
      const totalVariantStock = p.variants.reduce(
        (total, variant) =>
          total +
          variant.options.reduce(
            (subTotal, option) => subTotal + (option.stock || 0),
            0
          ),
        0
      );
      return totalVariantStock <= 0;
    } else {
      return (p.stock || 0) <= 0;
    }
  });

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isOutOfStock()) {
      this.toastService.show('Este producto está agotado.', 'error');
      return;
    }

    if (this.product) {
      // Para añadir desde la tarjeta, siempre asumimos la primera variante por defecto
      const defaultVariants: { [key: string]: string } = {};
      this.product.variants.forEach((variant) => {
        if (variant.options.length > 0) {
          defaultVariants[variant.name] = variant.options[0].name;
        }
      });

      this.cartService.addItem(this.product, defaultVariants, 1);
      this.toastService.show(
        `${this.product.name} añadido al carrito`,
        'success'
      );
    }
  }
}
