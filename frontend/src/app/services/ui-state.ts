import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiState {
  private _isCartFlyoutVisible = signal(false);
  public isCartFlyoutVisible = this._isCartFlyoutVisible.asReadonly();

  private _isMobileSearchVisible = signal(false);
  public isMobileSearchVisible = this._isMobileSearchVisible.asReadonly();

  private _isWishlistFlyoutVisible = signal(false);
  public isWishlistFlyoutVisible = this._isWishlistFlyoutVisible.asReadonly();

  constructor() {}

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
    // Opcional: cierra otros paneles al abrir este
    this.closeCartFlyout();
  }
  closeWishlistFlyout(): void {
    this._isWishlistFlyoutVisible.set(false);
  }
}
