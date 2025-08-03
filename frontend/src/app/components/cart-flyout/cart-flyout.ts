import { Component, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiState } from '../../services/ui-state';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart-flyout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-flyout.html',
  styleUrl: './cart-flyout.scss'
})
export class CartFlyout {
  public uiStateService = inject(UiState);
  public cartService = inject(CartService);

  // Esta línea aplica la clase 'visible' al <app-cart-flyout>
  // cuando el signal de uiStateService es true.
  @HostBinding('class.visible')
  get isVisible() {
    return this.uiStateService.isCartFlyoutVisible();
  }
}
