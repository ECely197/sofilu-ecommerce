import {
  Component,
  inject,
  signal,
  ElementRef,
  AfterViewInit,
  ViewChildren,
  QueryList,
  NgZone,
  ViewChild,
  HostListener,
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

// Importamos GSAP y el plugin SplitText
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Servicios
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { UiState } from '../../services/ui-state';
import { WishlistService } from '../../services/wishlist';
import {
  NavigationService,
  NavItem,
  SubCategory,
} from '../../services/navigation.service';

// Registramos el plugin
gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements AfterViewInit {
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public uiStateService = inject(UiState);
  private router = inject(Router);
  private zone = inject(NgZone);
  private lastScrollY = 0;
  private navigationService = inject(NavigationService);
  private elementRef = inject(ElementRef);

  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public isAdmin$: Observable<boolean> = this.authService.isAdmin$;
  public wishlistService = inject(WishlistService);
  isProfileMenuOpen = signal(false);

  navItems = signal<NavItem[]>([]);
  activeMenu = signal<NavItem | null>(null);
  activeSubCategory = signal<SubCategory | null>(null);

  // Obtenemos referencias a los elementos del DOM
  @ViewChildren('navLink', { read: ElementRef }) navLinks!: QueryList<
    ElementRef<HTMLAnchorElement>
  >;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;
  @ViewChild('navContainer') navContainer!: ElementRef<HTMLElement>;
  @ViewChild('profileMenu') profileMenu!: ElementRef<HTMLElement>;

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    const headerPill = this.navContainer.nativeElement.closest('.header-pill');

    // Si estamos haciendo scroll hacia abajo Y hemos pasado el inicio de la página
    if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
      gsap.to(headerPill, { y: -400, duration: 0.3, ease: 'power2.inOut' });
    }
    // Si estamos haciendo scroll hacia arriba
    else {
      gsap.to(headerPill, { y: 0, duration: 0.3, ease: 'power2.inOut' });
    }

    this.lastScrollY = currentScrollY;
  }

  ngOnInit() {
    this.navigationService
      .getNavigationData()
      .subscribe((data) => this.navItems.set(data));
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMegaMenu();
      });
  }

  // --- LÓGICA DEL MEGA MENÚ HÍBRIDO ---

  // 1. HostListener para cerrar con clic externo
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.activeMenu() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.closeMegaMenu();
    }
  }

  // 2. Abrir con hover (mouseenter)
  handleMouseEnter(item: NavItem): void {
    if (item.subCategories && item.subCategories.length > 0) {
      this.activeMenu.set(item);
      if (
        !this.activeSubCategory() ||
        !item.subCategories.find((s) => s.id === this.activeSubCategory()?.id)
      ) {
        this.activeSubCategory.set(item.subCategories[0]);
      }
    } else {
      // Si el item no tiene subcategorías (como "Inicio"), cerramos cualquier menú abierto
      this.closeMegaMenu();
    }
  }

  // 3. Este método ahora solo evita que el clic en el nav cierre el menú
  onNavClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  handleSubCategoryEnter(subCategory: SubCategory): void {
    this.activeSubCategory.set(subCategory);
  }

  closeMegaMenu(): void {
    this.activeMenu.set(null);
    this.activeSubCategory.set(null);
  }

  ngAfterViewInit() {
    // Ejecutamos las animaciones fuera de la zona de Angular para optimizar el rendimiento
    this.zone.runOutsideAngular(() => {
      gsap.from(this.navContainer.nativeElement.closest('.header-pill'), {
        y: -100, // Empieza 100px por encima de la pantalla
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.5, // Un pequeño retraso para que la página cargue primero
      });
      this.navLinks.changes.subscribe(() => this.setupNavAnimations());
      this.setupNavAnimations();

      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          setTimeout(() => this.updatePillToActiveLink(false), 150);
        });
    });
  }

  setupNavAnimations(): void {
    const pillEl = this.navPill.nativeElement;

    this.navLinks.forEach((linkRef) => {
      const linkEl = linkRef.nativeElement;
      const originalText = linkEl.querySelector('.nav-text-original');
      const revealText = linkEl.querySelector('.nav-text-reveal');

      const splitOriginal = new SplitText(originalText, { type: 'chars' });
      const splitReveal = new SplitText(revealText, { type: 'chars' });

      gsap.set(splitReveal.chars, { yPercent: 100 });

      linkEl.addEventListener('mouseenter', () => {
        gsap.to(splitOriginal.chars, {
          yPercent: -150,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.inOut',
        });
        gsap.to(splitReveal.chars, {
          yPercent: -45,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.inOut',
        });

        gsap.to(pillEl, {
          x: linkEl.offsetLeft,
          width: linkEl.offsetWidth,
          opacity: 1, // Solo muestra píldora si es el activo
          backgroundColor: 'var(--pastel-pink)',
          duration: 0.4,
          ease: 'power3.out',
        });
      });

      linkEl.addEventListener('mouseleave', () => {
        gsap.to(splitOriginal.chars, {
          yPercent: 0,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.inOut',
        });
        gsap.to(splitReveal.chars, {
          yPercent: 100,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.inOut',
        });

        this.updatePillToActiveLink(true);
      });
    });

    setTimeout(() => this.updatePillToActiveLink(false), 100);
  }

  updatePillToActiveLink(animated: boolean): void {
    const activeLink = this.navLinks.find((link) =>
      link.nativeElement.classList.contains('active')
    );

    if (activeLink) {
      const linkEl = activeLink.nativeElement;
      gsap.to(this.navPill.nativeElement, {
        x: linkEl.offsetLeft,
        width: linkEl.offsetWidth,
        opacity: 1,
        backgroundColor: 'var(--pastel-pink)', // Fondo rosa para el activo
        duration: animated ? 0.4 : 0,
        ease: 'power3.out',
      });
    } else {
      gsap.to(this.navPill.nativeElement, { opacity: 0, duration: 0.2 });
    }
  }

  handleSearch(event: Event, searchInput: HTMLInputElement): void {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
      searchInput.value = '';
      searchInput.blur();
    }
  }

  toggleProfileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    const isOpen = this.isProfileMenuOpen();
    this.isProfileMenuOpen.set(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        gsap.fromTo(
          this.profileMenu.nativeElement,
          { y: -20, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }
        );
      }, 0);
    }
  }

  closeAllMenus(): void {
    this.isProfileMenuOpen.set(false);
  }

  logout(): void {
    this.closeAllMenus();
    this.authService
      .logout()
      .then(() => this.router.navigate(['/']))
      .catch((error) => console.error('Error al cerrar sesión:', error));
  }
}
