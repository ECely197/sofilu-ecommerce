import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist';
import { UiState } from '../../services/ui-state';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

@Component({
  selector: 'app-wishlist-flyout',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './wishlist-flyout.html',
  styleUrl: './wishlist-flyout.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
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
export class WishlistFlyoutComponent {
  public wishlistService = inject(WishlistService);
  public uiState = inject(UiState);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  addToCart(product: Product): void {
    const defaultVariants: { [key: string]: string } = {};
    product.variants.forEach((variant) => {
      if (variant.options.length > 0) {
        defaultVariants[variant.name] = variant.options[0].name;
      }
    });
    this.cartService.addItem(product, defaultVariants, 1);
    this.toastService.show(`${product.name} añadido al carrito`, 'success');
  }

  // Llamamos directamente al toggle del servicio
  removeFromWishlist(product: Product): void {
    this.wishlistService.toggleProduct(product);
  }
}
