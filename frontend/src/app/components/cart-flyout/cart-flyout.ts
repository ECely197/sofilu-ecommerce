// Contenido completo y final para: src/app/components/cart-flyout/cart-flyout.ts

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
  // Nuevo: Signal para controlar el estado del permiso del giroscopio
  permissionState = signal<'prompt' | 'granted' | 'denied'>('prompt');

  // --- LÓGICA DE MOVIMIENTO ---

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
    // Ya no añadimos el listener aquí, esperamos al permiso
  }

  ngOnDestroy() {
    // Si el listener fue añadido, nos aseguramos de quitarlo
    window.removeEventListener(
      'deviceorientation',
      this.deviceOrientationHandler
    );
  }

  // Nuevo: Método para solicitar permiso al usuario
  async requestOrientationPermission() {
    // Comprobamos si estamos en un navegador que requiere este permiso (como Safari en iOS)
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permission === 'granted') {
          this.permissionState.set('granted');
          // Solo si nos dan permiso, empezamos a escuchar
          window.addEventListener(
            'deviceorientation',
            this.deviceOrientationHandler
          );
        } else {
          this.permissionState.set('denied');
        }
      } catch (error) {
        this.permissionState.set('denied');
      }
    } else {
      // Si estamos en un navegador que no requiere permiso (como Chrome en Android),
      // simplemente lo activamos.
      this.permissionState.set('granted');
      window.addEventListener(
        'deviceorientation',
        this.deviceOrientationHandler
      );
    }
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

  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  closeCart(): void {
    this.uiState.closeCartFlyout();
    this.pupilTransform.set('translate(0, 0)');
  }
}
