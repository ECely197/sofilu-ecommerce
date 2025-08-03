import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiState {
   // Creamos un signal que guardará si el flyout está visible.
  // Por defecto, está oculto (false).
  isCartFlyoutVisible = signal(false);

  constructor() { }

  // Método para abrir el flyout
  openCartFlyout(): void {
    this.isCartFlyoutVisible.set(true);
  }

  // Método para cerrar el flyout
  closeCartFlyout(): void {
    this.isCartFlyoutVisible.set(false);
  }
}
