/**
 * =========================================================================
 * COMPONENTE RAÍZ (APP ROOT)
 * =========================================================================
 * Este es el componente principal y el punto de entrada de la vista de la aplicación.
 * Orquesta componentes globales (Header, Footer, Modals) y gestiona la lógica
 * de alto nivel, como las animaciones de ruta y la inicialización de librerías.
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  DOCUMENT,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  RouterOutlet,
} from '@angular/router';
import { filter, tap } from 'rxjs';

// --- Componentes Globales de la UI ---
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CartFlyout } from './components/cart-flyout/cart-flyout';
import { BottomNavBarComponent } from './components/bottom-nav-bar.component/bottom-nav-bar.component';
import { ToastContainerComponent } from './components/toast/toast';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal';
import { ProductExplorerModalComponent } from './components/product-explorer-modal/product-explorer-modal';
import { CustomerDetailModalComponent } from './components/customer-detail-modal/customer-detail-modal';
import { WishlistFlyoutComponent } from './components/wishlist-flyout/wishlist-flyout';

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
  imports: [
    CommonModule,
    Header,
    Footer,
    CartFlyout,
    ToastContainerComponent,
    ConfirmationModalComponent,
    ProductExplorerModalComponent,
    CustomerDetailModalComponent,
    WishlistFlyoutComponent,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeAnimations],
})
export class App implements OnInit, OnDestroy {
  // --- Inyecciones ---
  private router = inject(Router);
  public uiState = inject(UiState);
  private scrollService = inject(ScrollService);
  private document = inject(DOCUMENT);

  // --- Estado ---
  showGlobalHeaderAndFooter = signal(true);

  constructor() {
    // --- ¡EFECTO PARA EL MODAL! ---
    // Este `effect` se ejecutará cada vez que la señal `isModalOpen` cambie.
    effect(() => {
      if (this.uiState.isModalOpen()) {
        this.document.body.classList.add('modal-is-open');
      } else {
        this.document.body.classList.remove('modal-is-open');
      }
    });
  }
  /**
   * Hook del ciclo de vida de Angular que se ejecuta una vez que el componente se ha inicializado.
   */
  ngOnInit() {
    // Estas inicializaciones solo se hacen una vez.
    this.scrollService.init();
    this.initializeAOS();

    // Este método ahora manejará TODA la lógica de navegación.
    this.handlePageTransitions();
  }

  ngOnDestroy() {
    this.scrollService.destroy();
  }

  // --- ¡MÉTODO UNIFICADO Y CORREGIDO! ---
  private handlePageTransitions(): void {
    // Muestra el Preloader al INICIAR la navegación
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart => event instanceof NavigationStart
        ),
        tap(() => this.document.body.classList.add('is-loading'))
      )
      .subscribe();

    // Reacciona al FINALIZAR la navegación
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        ),
        tap((event) => {
          // --- Lógica de Header/Footer ---
          if (event instanceof NavigationEnd) {
            const url = event.urlAfterRedirects;
            const routesToHideOn = ['/checkout', '/admin'];
            const shouldHide = routesToHideOn.some((route) =>
              url.startsWith(route)
            );
            this.showGlobalHeaderAndFooter.set(!shouldHide);
          }

          // --- Lógica de Preloader y Scroll ---
          setTimeout(() => {
            this.document.body.classList.remove('is-loading');
            AOS.refresh();
            window.scrollTo(0, 0);
          }, 300);
        })
      )
      .subscribe();
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
