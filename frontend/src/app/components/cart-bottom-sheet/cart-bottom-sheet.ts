import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { UiState } from '../../services/ui-state';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-cart-bottom-sheet',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './cart-bottom-sheet.html',
  styleUrl: './cart-bottom-sheet.scss',
})
export class CartBottomSheetComponent {
  public cartService = inject(CartService);
  public uiState = inject(UiState);

  objectKeys(obj: object): string[] {
    return obj ? Object.keys(obj) : [];
  }

  closeCart(): void {
    this.uiState.closeCartFlyout();
  }
}
