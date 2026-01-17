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
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
} from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { User } from '@angular/fire/auth';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { UiState } from '../../services/ui-state';
import { WishlistService } from '../../services/wishlist';
import {
  NavigationService,
  NavItem,
  SubCategory,
} from '../../services/navigation.service';
import { ScrollManagerService } from '../../services/scroll-manager.service';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, AfterViewInit, OnDestroy {
  // --- Inyecciones y Propiedades (la mayoría se mantienen) ---
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public uiStateService = inject(UiState);
  public wishlistService = inject(WishlistService);
  private router = inject(Router);
  private zone = inject(NgZone);
  private navigationService = inject(NavigationService);
  private elementRef = inject(ElementRef);
  private scrollManager = inject(ScrollManagerService);

  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public isAdmin$: Observable<boolean> = this.authService.isAdmin$;

  isProfileMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);
  activeAccordion = signal<string | null>(null);

  navItems = signal<NavItem[]>([]);
  activeMenu = signal<NavItem | null>(null);
  activeSubCategory = signal<SubCategory | null>(null);

  @ViewChildren('navLink') navLinks!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;

  private routerSub: Subscription | null = null;
  private splitTexts: SplitText[] = [];

  constructor() {}

  ngOnInit() {
    this.navigationService.getNavigationData().subscribe((data) => {
      this.navItems.set(data);
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setTimeout(() => this.setupNavAnimations(), 100);
      }
    });

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeAllMenus();
        document.body.style.overflow = '';
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setTimeout(() => this.updatePillToActiveLink(), 200);
        }
      });
  }

  ngAfterViewInit() {
    // Correr toda la lógica de scroll fuera de Angular para máximo rendimiento
    this.zone.runOutsideAngular(() => {
      this.initSmartHeader(); // Lógica de ocultar/mostrar
    });
  }

  ngOnDestroy() {
    this.revertSplitText();
    if (this.routerSub) this.routerSub.unsubscribe();
    // Limpiar todos los triggers de GSAP para evitar fugas de memoria
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  // --- LÓGICA DE HEADER INTELIGENTE (SHY HEADER) ---
  private initSmartHeader(): void {
    const headerDesktop =
      this.elementRef.nativeElement.querySelector('.sofilu-header');
    const headerMobile = this.elementRef.nativeElement.querySelector(
      '.mobile-floating-header'
    );
    const footer = document.querySelector('app-footer');

    // 1. Ocultar al hacer scroll hacia abajo, mostrar al subir
    ScrollTrigger.create({
      start: 'top top-=' + (headerDesktop?.offsetHeight || 80),
      end: 99999,
      onUpdate: (self) => {
        const isScrollingDown = self.direction === 1;
        if (isScrollingDown) {
          headerDesktop?.classList.add('is-hidden');
          headerMobile?.classList.add('is-hidden');
        } else {
          headerDesktop?.classList.remove('is-hidden');
          headerMobile?.classList.remove('is-hidden');
        }
      },
    });

    // 2. Ocultar cuando el footer es visible
    if (footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: 'top bottom', // Cuando el top del footer toca el bottom de la pantalla
        end: 'bottom top', // Cuando el bottom del footer deja el top de la pantalla
        toggleClass: {
          targets: 'body',
          className: 'footer-visible',
        },
      });
    }
  }

  // --- MÉTODOS MÓVIL ---
  toggleMobileMenu() {
    this.isMobileMenuOpen.update((v) => !v);
    if (this.isMobileMenuOpen()) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }

  handleMobileSearch(event: Event, input: HTMLInputElement) {
    event.preventDefault();
    const query = input.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
      this.isMobileMenuOpen.set(false);
      document.body.style.overflow = '';
      input.value = '';
    }
  }

  toggleAccordion(id: string): void {
    this.activeAccordion.update((current) => (current === id ? null : id));
  }

  // --- MÉTODOS DESKTOP (Animaciones) ---

  private revertSplitText() {
    this.splitTexts.forEach((st) => st.revert());
    this.splitTexts = [];
  }

  setupNavAnimations(): void {
    if (!this.navPill || !this.navLinks || window.innerWidth < 1024) return;
    this.revertSplitText();
    const pillEl = this.navPill.nativeElement;

    this.navLinks.forEach((linkRef) => {
      const linkWrapperEl = linkRef.nativeElement;
      const linkAnchorEl = linkWrapperEl.querySelector(
        '.nav-link'
      ) as HTMLElement;
      if (!linkAnchorEl) return;
      const originalText = linkAnchorEl.querySelector('.nav-text-original');
      const revealText = linkAnchorEl.querySelector('.nav-text-reveal');

      if (originalText && revealText) {
        const splitOriginal = new SplitText(originalText, { type: 'chars' });
        const splitReveal = new SplitText(revealText, { type: 'chars' });
        this.splitTexts.push(splitOriginal, splitReveal);
        gsap.set(splitReveal.chars, { yPercent: 100 });

        linkWrapperEl.onmouseenter = () => {
          const targetX = linkWrapperEl.offsetLeft;
          const targetWidth = linkWrapperEl.offsetWidth;
          gsap.to(pillEl, {
            x: targetX,
            width: targetWidth,
            opacity: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
            overwrite: true,
          });
          gsap.to(splitOriginal.chars, {
            yPercent: -150,
            stagger: 0.02,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
          gsap.to(splitReveal.chars, {
            yPercent: -100,
            stagger: 0.02,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        };

        linkWrapperEl.onmouseleave = () => {
          if (!linkAnchorEl.classList.contains('active')) {
            gsap.to(splitOriginal.chars, {
              yPercent: 0,
              stagger: 0.02,
              duration: 0.3,
              ease: 'power2.in',
              overwrite: true,
            });
            gsap.to(splitReveal.chars, {
              yPercent: 100,
              stagger: 0.02,
              duration: 0.3,
              ease: 'power2.in',
              overwrite: true,
            });
          }
          this.updatePillToActiveLink();
        };
      }
    });
    this.updatePillToActiveLink();
  }

  updatePillToActiveLink(): void {
    if (!this.navPill || !this.navLinks || window.innerWidth < 1024) return;

    // CORRECCIÓN TYPESCRIPT (=== true)
    const activeLinkWrapper = this.navLinks.find(
      (linkRef) =>
        linkRef.nativeElement
          .querySelector('a')
          ?.classList.contains('active') === true
    );

    if (activeLinkWrapper) {
      const el = activeLinkWrapper.nativeElement;
      gsap.to(this.navPill.nativeElement, {
        x: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.75)',
        overwrite: 'auto',
      });

      this.navLinks.forEach((wrapper) => {
        const isActive = wrapper === activeLinkWrapper;
        const anchor = wrapper.nativeElement.querySelector('.nav-link');
        if (!anchor) return;
        const originalText = anchor.querySelector('.nav-text-original');
        const revealText = anchor.querySelector('.nav-text-reveal');
        if (originalText && revealText) {
          const charsOrig = originalText.querySelectorAll('div');
          const charsReveal = revealText.querySelectorAll('div');
          if (charsOrig.length > 0) {
            if (isActive) {
              gsap.to(charsOrig, {
                yPercent: -150,
                duration: 0.3,
                overwrite: true,
              });
              gsap.to(charsReveal, {
                yPercent: -100,
                duration: 0.3,
                overwrite: true,
              });
            } else {
              gsap.to(charsOrig, {
                yPercent: 0,
                duration: 0.3,
                overwrite: true,
              });
              gsap.to(charsReveal, {
                yPercent: 100,
                duration: 0.3,
                overwrite: true,
              });
            }
          }
        }
      });
    } else {
      gsap.to(this.navPill.nativeElement, { opacity: 0, duration: 0.3 });
    }
  }

  @ViewChild('subCategoryPill') subCategoryPill!: ElementRef<HTMLElement>;
  handleMouseEnter(item: NavItem): void {
    if (item.subCategories && item.subCategories.length > 0) {
      this.activeMenu.set(item);
      this.activeSubCategory.set(item.subCategories[0]);
    } else {
      this.activeMenu.set(null);
    }
  }
  handleMouseLeave(): void {
    this.activeMenu.set(null);
    this.activeSubCategory.set(null);
  }
  handleSubCategoryEnter(sub: SubCategory, event: MouseEvent): void {
    this.activeSubCategory.set(sub);
    const target = event.currentTarget as HTMLElement;
    this.zone.runOutsideAngular(() => {
      if (this.subCategoryPill) {
        gsap.to(this.subCategoryPill.nativeElement, {
          top: target.offsetTop,
          height: target.offsetHeight,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    });
  }
  handleSubCategoryListLeave(): void {
    this.zone.runOutsideAngular(() => {
      if (this.subCategoryPill) {
        gsap.to(this.subCategoryPill.nativeElement, {
          opacity: 0,
          duration: 0.2,
        });
      }
    });
  }

  handleSubCategoryClick(event: MouseEvent, subCategory: SubCategory): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeMegaMenu();
    this.isMobileMenuOpen.set(false);
    document.body.style.overflow = '';
    if (this.router.url === '/') {
      this.scrollManager.requestScrollToCategory(subCategory.id);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(
          () => this.scrollManager.requestScrollToCategory(subCategory.id),
          100
        );
      });
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
    this.isProfileMenuOpen.update((v) => !v);
  }
  closeMegaMenu(): void {
    this.activeMenu.set(null);
  }
  closeAllMenus(): void {
    this.isProfileMenuOpen.set(false);
  }
  logout(): void {
    this.closeAllMenus();
    this.authService.logout().then(() => this.router.navigate(['/']));
  }
  @HostListener('document:click') onDocumentClick(): void {
    this.isProfileMenuOpen.set(false);
  }
}
