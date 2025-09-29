/**
 * =========================================================================
 * COMPONENTE RAÍZ (APP ROOT)
 * =========================================================================
 * Este es el componente principal y el punto de entrada de la vista de la aplicación.
 * Orquesta componentes globales (Header, Footer, Modals) y gestiona la lógica
 * de alto nivel, como las animaciones de ruta y la inicialización de librerías.
 */

import { Component, OnInit, inject, signal, DOCUMENT } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

// --- Componentes Globales de la UI ---
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CartFlyout } from './components/cart-flyout/cart-flyout';
import { BottomNavBarComponent } from './components/bottom-nav-bar.component/bottom-nav-bar.component';
import { ToastContainerComponent } from './components/toast/toast';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal';
import { ProductExplorerModalComponent } from './components/product-explorer-modal/product-explorer-modal';
import { CustomerDetailModalComponent } from './components/customer-detail-modal/customer-detail-modal';
import { WishlistFlyoutComponent } from './components/wishlist-flyout/wishlist-flyout'; // ¡IMPORTACIÓN CORREGIDA!

// --- Servicios y Animaciones ---
import { UiState } from './services/ui-state';
import { routeAnimations } from './route-animations';
import { ScrollService } from './services/scroll.service';
import { OnDestroy } from '@angular/core';

// Importación de la librería AOS (Animate On Scroll)
import * as AOS from 'aos';
import { AosOptions } from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  // ¡CORRECCIÓN CLAVE! Todos los componentes usados en app.html deben estar aquí.
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Footer,
    CartFlyout,
    BottomNavBarComponent,
    ToastContainerComponent,
    ConfirmationModalComponent,
    ProductExplorerModalComponent, // ¡IMPORTACIÓN CORREGIDA!
    CustomerDetailModalComponent, // ¡IMPORTACIÓN CORREGIDA!
    WishlistFlyoutComponent, // ¡IMPORTACIÓN CORREGIDA!
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeAnimations], // Asocia las animaciones de ruta al componente
})
export class App implements OnInit, OnDestroy {
  // --- Inyección de Dependencias ---
  private router = inject(Router);
  public uiState = inject(UiState);
  private scrollService = inject(ScrollService);
  private document = inject(DOCUMENT);

  // --- Estado del Componente con Signals ---
  showGlobalHeaderAndFooter = signal(true);

  /**
   * Hook del ciclo de vida de Angular que se ejecuta una vez que el componente se ha inicializado.
   */
  ngOnInit() {
    this.scrollService.init();
    this.initializeAOS();
    this.subscribeToRouterEvents();

    setTimeout(() => {
      this.document.body.classList.add('loaded');
    }, 500); // 500ms es un buen punto de partida, ajústalo si es necesario
  }
  ngOnDestroy() {
    this.scrollService.destroy();
  }

  /**
   * Configura e inicializa la librería Animate On Scroll (AOS).
   */
  private initializeAOS(): void {
    const aosConfig: AosOptions = {
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
    };
    AOS.init(aosConfig);
  }

  /**
   * Se suscribe a los eventos de navegación del router para ejecutar lógica
   * en cada cambio de página.
   */
  private subscribeToRouterEvents(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        const shouldHide =
          url.includes('/checkout') || url.startsWith('/admin');
        this.showGlobalHeaderAndFooter.set(!shouldHide);
        setTimeout(() => AOS.refresh(), 100);
        window.scrollTo(0, 0);
      });
  }

  /**
   * Prepara la animación de ruta para el <router-outlet>.
   * Lee el valor de la propiedad `data.animation` de la ruta activa.
   * @param outlet La directiva RouterOutlet.
   * @returns El nombre de la animación de la ruta actual.
   */
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }

  // Lógica de búsqueda que estaba en tu componente original, la restauro por si la usas
  handleSearch(event: Event, searchInput: HTMLInputElement): void {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
      searchInput.value = '';
      this.uiState.closeMobileSearch();
    }
  }
}
