// Contenido Completo, Final y Limpio para: src/app/components/bottom-nav-bar.component.ts

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
  // --- INYECCIÓN DE SERVICIOS ---
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public uiStateService = inject(UiState); // Hecho público para el HTML
  private router = inject(Router);

  // --- LÓGICA DE ANIMACIÓN DE LA BURBUJA ---
  @ViewChildren('navItem') navItems!: QueryList<ElementRef<HTMLElement>>;
  pillStyle = signal({ left: '0px', width: '0px', opacity: 0 });

  // --- LÓGICA DE SCROLL INTELIGENTE ---
  private lastScrollY = 0;
  isNavBarVisible = signal(true);

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
      this.isNavBarVisible.set(false); // Ocultar al bajar
    } else {
      this.isNavBarVisible.set(true); // Mostrar al subir
    }
    this.lastScrollY = currentScrollY;
  }

  // --- CICLO DE VIDA ---
  ngAfterViewInit() {
    this.navItems.changes.subscribe(() => {
      this.updatePillPosition();
    });

    setTimeout(() => this.updatePillPosition(), 100);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.updatePillPosition(), 100);
      });
  }

  // --- MÉTODO PARA LA BURBUJA ---
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
      this.pillStyle.update((style) => ({ ...style, opacity: 0 }));
    }
  }
  handleSearch(event: Event, searchInput: HTMLInputElement): void {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
      searchInput.value = '';
      this.uiStateService.closeMobileSearch(); // Cierra a través del servicio
    }
  }
}
