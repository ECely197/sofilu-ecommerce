import {
  Component,
  HostListener,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart';
import { UiState } from '../../services/ui-state';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-cart-flyout',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './cart-flyout.html',
  styleUrl: './cart-flyout.scss',
})
export class CartFlyout implements OnInit, OnDestroy {
  public cartService = inject(CartService);
  public uiState = inject(UiState);

  pupilTransform = signal('');

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.uiState.isCartFlyoutVisible()) return;

    const mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    const mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    this.updatePupilPosition(mouseX, mouseY);
  }

  private deviceOrientationHandler = (event: DeviceOrientationEvent) =>
    this.onDeviceMove(event);

  ngOnInit() {
    window.addEventListener('deviceorientation', this.deviceOrientationHandler);
  }

  ngOnDestroy() {
    window.removeEventListener(
      'deviceorientation',
      this.deviceOrientationHandler
    );
  }

  onDeviceMove(event: DeviceOrientationEvent) {
    if (
      !this.uiState.isCartFlyoutVisible() ||
      event.gamma === null ||
      event.beta === null
    )
      return;

    const moveX = event.gamma / 90;
    const moveY = (event.beta - 90) / 90;

    this.updatePupilPosition(moveX, moveY);
  }

  updatePupilPosition(normalizedX: number, normalizedY: number) {
    const maxMoveX = 4;
    const maxMoveY = 3;

    const moveX = Math.max(
      -maxMoveX,
      Math.min(maxMoveX, normalizedX * maxMoveX)
    );
    const moveY = Math.max(
      -maxMoveY,
      Math.min(maxMoveY, normalizedY * maxMoveY)
    );

    this.pupilTransform.set(`translate(${moveX}px, ${moveY}px)`);
  }

  // --- FIN DE LA LÓGICA DEL GATO ---

  public objectKeys(obj: object): string[] {
    if (!obj) {
      return [];
    }
    return Object.keys(obj);
  }

  closeCart(): void {
    this.uiState.closeCartFlyout();
    this.pupilTransform.set('translate(0, 0)');
  }
}
