// Contenido completo para: src/app/pages/cart/cart.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations'; // Importaciones para animación

import { CartService } from '../../services/cart';
import { CartItem } from '../../interfaces/cart-item.interface';
import { RippleDirective } from '../../directives/ripple';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class Cart {
  public cartService = inject(CartService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  /**
   * Pide confirmación al usuario antes de vaciar el carrito.
   */
  async clearCartWithConfirmation(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Vaciar Carrito?',
      message:
        '¿Estás seguro de que quieres eliminar todos los productos de tu carrito?',
      confirmText: 'Sí, vaciar',
    });

    if (confirmed) {
      this.cartService.clearCart();
      this.toastService.show('Tu carrito ha sido vaciado.');
    }
  }

  public objectKeys(obj: object): string[] {
    if (!obj) {
      return [];
    }
    return Object.keys(obj);
  }
  public finalItemPrice(item: CartItem): number {
    let price = item.product.price;
    if (item.selectedVariants && item.product.variants) {
      for (const variantName in item.selectedVariants) {
        const selectedOptionName = item.selectedVariants[variantName];
        const variant = item.product.variants.find(
          (v) => v.name === variantName
        );
        const option = variant?.options.find(
          (o) => o.name === selectedOptionName
        );
        if (option && option.price) {
          price += option.price;
        }
      }
    }
    return price;
  }
}
