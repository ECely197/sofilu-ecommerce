/**
 * @fileoverview Servicio de Estado de la Interfaz de Usuario Global.
 * Gestiona estados globales de la UI como la visibilidad de paneles flotantes (flyouts)
 * o modales, utilizando Signals para una reactividad eficiente.
 * Este patrón previene la comunicación compleja entre componentes no relacionados.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiState {
  // --- Estado del Flyout del Carrito ---
  private _isCartFlyoutVisible = signal(false);
  /** Signal de solo lectura para saber si el flyout del carrito está visible. */
  public isCartFlyoutVisible = this._isCartFlyoutVisible.asReadonly();

  // --- Estado de la Búsqueda Móvil ---
  private _isMobileSearchVisible = signal(false);
  /** Signal de solo lectura para saber si la barra de búsqueda móvil está visible. */
  public isMobileSearchVisible = this._isMobileSearchVisible.asReadonly();

  // --- Estado del Flyout de la Lista de Deseos ---
  private _isWishlistFlyoutVisible = signal(false);
  /** Signal de solo lectura para saber si el flyout de la lista de deseos está visible. */
  public isWishlistFlyoutVisible = this._isWishlistFlyoutVisible.asReadonly();

  // --- ¡SEÑAL GLOBAL PARA MODALES! ---
  private _isModalOpen = signal(false);
  public isModalOpen = this._isModalOpen.asReadonly();

  // --- Métodos Públicos para Mutar el Estado ---
  openCartFlyout(): void {
    this._isCartFlyoutVisible.set(true);
  }
  closeCartFlyout(): void {
    this._isCartFlyoutVisible.set(false);
  }

  openMobileSearch(): void {
    this._isMobileSearchVisible.set(true);
  }
  closeMobileSearch(): void {
    this._isMobileSearchVisible.set(false);
  }

  openWishlistFlyout(): void {
    this._isWishlistFlyoutVisible.set(true);
    this.closeCartFlyout(); // Cierra otros paneles para una mejor UX.
  }
  closeWishlistFlyout(): void {
    this._isWishlistFlyoutVisible.set(false);
  }
  setModalState(isOpen: boolean): void {
    this._isModalOpen.set(isOpen);
  }
}
