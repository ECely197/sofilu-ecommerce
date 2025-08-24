import {
  Component,
  inject,
  signal,
  ElementRef,
  AfterViewInit,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { gsap } from 'gsap';
import { trigger, transition, style, animate } from '@angular/animations';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { UiState } from '../../services/ui-state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  animations: [
    trigger('flyInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
        animate(
          '150ms ease-out',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'scale(0.95) translateY(-50px)' })
        ),
      ]),
    ]),
  ],
})
export class Header implements AfterViewInit {
  public cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public uiStateService = inject(UiState);

  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public isAdmin$: Observable<boolean> = this.authService.isAdmin$;

  isProfileMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);

  @ViewChildren('navLink', { read: ElementRef }) navLinks!: QueryList<
    ElementRef<HTMLAnchorElement>
  >;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;
  @ViewChild('navContainer') navContainer!: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    // Esperamos a que los elementos estén disponibles en el DOM
    this.navLinks.changes.subscribe(() => this.setupNavAnimations());

    // Usamos un pequeño retraso para asegurar que Angular haya aplicado la clase 'active' inicial
    setTimeout(() => {
      this.setupNavAnimations();
      this.updatePillToActiveLink(false);
    }, 100);

    // Actualizamos la píldora cada vez que la navegación termina
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.updatePillToActiveLink(false), 100);
      });
  }

  // --- ¡LÓGICA DE ANIMACIÓN UNIFICADA CON GSAP! ---
  private setupNavAnimations(): void {
    const pillEl = this.navPill.nativeElement;

    this.navLinks.forEach((linkRef) => {
      const linkEl = linkRef.nativeElement;
      const textWrapper = linkEl.querySelector('.nav-link-text-inner');

      // Animación al entrar el mouse en un enlace
      linkEl.addEventListener('mouseenter', () => {
        // Mover la píldora
        gsap.to(pillEl, {
          x: linkEl.offsetLeft,
          width: linkEl.offsetWidth,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
        });
        // Animar el texto (efecto "slot machine")
        if (textWrapper) {
          gsap.to(textWrapper, {
            yPercent: -56,
            duration: 0.28,
            ease: 'power2.inOut',
          });
        }
      });
    });

    // Animación al salir el mouse del contenedor de navegación
    this.navContainer.nativeElement.addEventListener('mouseleave', () => {
      this.updatePillToActiveLink(true);
    });
  }

  public updatePillToActiveLink(animated: boolean = true): void {
    if (!this.navLinks || this.navLinks.length === 0) return;

    const activeLink = this.navLinks.find((link) =>
      link.nativeElement.classList.contains('active')
    );

    // Revertir la animación de texto para todos los enlaces que no sean el activo
    this.navLinks.forEach((linkRef) => {
      const linkEl = linkRef.nativeElement;
      if (linkEl !== activeLink?.nativeElement) {
        const textWrapper = linkEl.querySelector('.nav-link-text-inner');
        if (textWrapper) {
          gsap.to(textWrapper, {
            yPercent: 0,
            duration: 0.2,
            ease: 'power2.inOut',
          });
        }
      }
    });

    if (activeLink) {
      const linkEl = activeLink.nativeElement;
      // Mueve la píldora a la posición del enlace activo
      gsap.to(this.navPill.nativeElement, {
        x: linkEl.offsetLeft,
        width: linkEl.offsetWidth,
        opacity: 1,
        duration: animated ? 0.3 : 0,
        ease: 'power3.out',
      });
      // Asegurarse de que el texto activo esté en la posición correcta (sin animar)
      const activeTextWrapper = linkEl.querySelector('.nav-link-text-inner');
      if (activeTextWrapper) {
        gsap.set(activeTextWrapper, { yPercent: 0 });
      }
    } else {
      // Si no hay ningún enlace activo, oculta la píldora
      gsap.to(this.navPill.nativeElement, { opacity: 0, duration: 0.2 });
    }
  }

  // --- (El resto de tus métodos: toggleProfileMenu, logout, etc. se quedan igual) ---
  toggleProfileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isProfileMenuOpen.update((value) => !value);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
    document.body.style.overflow = this.isMobileMenuOpen() ? 'hidden' : '';
  }

  closeAllMenus(): void {
    this.isProfileMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    document.body.style.overflow = '';
  }

  logout(): void {
    this.closeAllMenus();
    this.authService
      .logout()
      .then(() => this.router.navigate(['/']))
      .catch((error) => console.error('Error al cerrar sesión:', error));
  }
}
