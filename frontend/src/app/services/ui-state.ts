import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiState {
  private _isCartFlyoutVisible = signal(false);

  // Creamos una propiedad pública de solo lectura para que los componentes
  // puedan leer el estado del signal de forma segura.
  public isCartFlyoutVisible = this._isCartFlyoutVisible.asReadonly();

  constructor() { }

  // Método público para abrir el flyout
  openCartFlyout(): void {
    this._isCartFlyoutVisible.set(true);
  }

  // Método público para cerrar el flyout
  closeCartFlyout(): void {
    this._isCartFlyoutVisible.set(false);
  }
}
