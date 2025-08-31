// En: frontend/src/app/app.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CartFlyout } from './components/cart-flyout/cart-flyout';
import { BottomNavBarComponent } from './components/bottom-nav-bar.component/bottom-nav-bar.component';
import { ToastContainerComponent } from './components/toast/toast';
import { UiState } from './services/ui-state';

// Importamos AOS y su tipo de opciones
import * as AOS from 'aos';
import { AosOptions } from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Footer,
    CartFlyout,
    BottomNavBarComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private router = inject(Router);
  public uiState = inject(UiState);
  showGlobalHeaderAndFooter = signal(true);
  isSearchVisible = signal(false);

  ngOnInit() {
    // 1. Configuración inicial de AOS
    const aosConfig: AosOptions = {
      duration: 800, // Duración de la animación
      easing: 'ease-out-cubic', // Curva de aceleración suave
      once: true, // La animación solo ocurre una vez
      offset: 50, // Se dispara un poco antes de que el elemento entre en vista
    };
    AOS.init(aosConfig);

    // 2. Suscripción a los eventos de navegación
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;

        // Lógica para mostrar/ocultar header y footer
        if (url.includes('/checkout') || url.startsWith('/admin')) {
          this.showGlobalHeaderAndFooter.set(false);
        } else {
          this.showGlobalHeaderAndFooter.set(true);
        }

        // Lógica para refrescar AOS después de cada navegación
        // Usamos un pequeño setTimeout para darle tiempo al DOM de actualizarse
        setTimeout(() => {
          AOS.refresh();
        }, 100);

        // Opcional: Volver al principio de la página en cada navegación
        window.scrollTo(0, 0);
      });
  }

  handleSearch(event: Event, searchInput: HTMLInputElement): void {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
      searchInput.value = '';
      this.uiState.closeMobileSearch(); // Cierra a través del servicio
    }
  }
}
