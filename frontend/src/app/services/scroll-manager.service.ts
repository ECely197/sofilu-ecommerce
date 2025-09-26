// En: frontend/src/app/services/scroll-manager.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScrollManagerService {
  // Un Subject es como un "canal de radio" al que los componentes pueden suscribirse y emitir eventos.
  private categoryScrollRequest = new Subject<string>();

  // Observable público para que los componentes escuchen los eventos.
  public categoryScrollRequest$ = this.categoryScrollRequest.asObservable();

  /**
   * Emite un evento para solicitar un scroll y expansión a una categoría específica.
   * @param categorySlug El slug de la categoría a la que se debe hacer scroll.
   */
  requestScrollToCategory(categorySlug: string): void {
    this.categoryScrollRequest.next(categorySlug);
  }
}
