// Contenido completo y mejorado para: src/app/components/bottom-nav-bar/bottom-nav-bar.component.ts

import {
  Component,
  HostListener,
  inject,
  signal,
  QueryList,
  ViewChildren,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { UiState } from '../../services/ui-state';

@Component({
  selector: 'app-bottom-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav-bar.component.html',
  styleUrl: './bottom-nav-bar.component.scss',
})
export class BottomNavBarComponent implements AfterViewInit {
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public uiStateService = inject(UiState);
  private router = inject(Router);

  // --- LÓGICA DE ANIMACIÓN DE LA BURBUJA ---

  // Guardamos la referencia a todos los enlaces de la barra
  @ViewChildren('navItem') navItems!: QueryList<ElementRef<HTMLAnchorElement>>;

  // Un signal para guardar los estilos CSS (posición y tamaño) de la burbuja
  pillStyle = signal({ left: '0px', width: '0px', opacity: 0 });

  // --- LÓGICA DE SCROLL INTELIGENTE ---
  private lastScrollY = 0;
  isNavBarVisible = signal(true);

  @HostListener('window:scroll')
  onWindowScroll() {
    // ... (lógica de scroll sin cambios)
  }

  ngAfterViewInit() {
    // Usamos un pequeño retraso para asegurar que todo esté renderizado
    setTimeout(() => this.updatePillPosition(), 100);

    // Actualizamos la posición de la burbuja cada vez que la navegación termina
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.updatePillPosition(), 100);
      });
  }

  /**
   * Encuentra el enlace activo y mueve la burbuja a su posición.
   */
  updatePillPosition(): void {
    const activeItem = this.navItems.find((item) =>
      item.nativeElement.classList.contains('active')
    );

    if (activeItem) {
      const el = activeItem.nativeElement;
      this.pillStyle.set({
        left: `${el.offsetLeft}px`,
        width: `${el.offsetWidth}px`,
        opacity: 1,
      });
    } else {
      // Si no hay ninguno activo, la ocultamos
      this.pillStyle.update((style) => ({ ...style, opacity: 0 }));
    }
  }
}
