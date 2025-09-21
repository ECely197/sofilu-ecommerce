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
import { ProductModalService } from '../../services/product-modal.service';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, AfterViewInit {
  // --- Inyecciones ---
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  public uiStateService = inject(UiState);
  public wishlistService = inject(WishlistService);
  private router = inject(Router);
  private zone = inject(NgZone);
  private navigationService = inject(NavigationService);
  private elementRef = inject(ElementRef);
  private productModalService = inject(ProductModalService);

  // --- Signals ---
  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public isAdmin$: Observable<boolean> = this.authService.isAdmin$;
  isProfileMenuOpen = signal(false);
  navItems = signal<NavItem[]>([]);
  activeMenu = signal<NavItem | null>(null);
  activeSubCategory = signal<SubCategory | null>(null);

  // --- Referencias al DOM ---
  @ViewChildren('navLink') navLinks!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;
  @ViewChild('navContainer') navContainer!: ElementRef<HTMLElement>;
  @ViewChild('profileMenu') profileMenu!: ElementRef<HTMLElement>;
  @ViewChildren('subCategoryLink') subCategoryLinks!: QueryList<ElementRef>;
  @ViewChildren('previewCard') previewCards!: QueryList<ElementRef>;
  @ViewChild('subCategoryPill') subCategoryPill!: ElementRef<HTMLElement>;

  private lastScrollY = 0;

  @HostListener('window:scroll')
  onWindowScroll() {
    const headerPill = this.navContainer?.nativeElement.closest(
      '.header-pill, .logo-wrapper'
    );
    if (!headerPill) return;

    const currentScrollY = window.scrollY;
    if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
      gsap.to(headerPill, { y: -97.5, duration: 0.3, ease: 'power2.inOut' });
      gsap.to(headerPill.querySelector('.logo-wrapper'), {
        y: 80,
        duration: 0.3,
        ease: 'power2.inOut',
      });
    } else {
      gsap.to(headerPill, { y: 0, duration: 0.3, ease: 'power2.inOut' });
      gsap.to(headerPill.querySelector('.logo-wrapper'), {
        y: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        backgroundColor: 'transparent',
      });
    }
    this.lastScrollY = currentScrollY;
  }

  constructor() {}

  ngOnInit() {
    this.navigationService
      .getNavigationData()
      .subscribe((data) => this.navItems.set(data));
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMegaMenu());
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      gsap.from(this.navContainer.nativeElement.closest('.header-pill'), {
        y: -100,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.5,
      });
      this.navLinks.changes.subscribe(() => this.setupNavAnimations());
      this.setupNavAnimations();
      this.previewCards.changes.subscribe(() => this.animatePreviewCards());
    });
  }

  // --- Lógica del Mega Menú ---
  handleMouseEnter(item: NavItem): void {
    if (item.subCategories && item.subCategories.length > 0) {
      this.activeMenu.set(item);
      this.activeSubCategory.set(item.subCategories[0]);
    }
  }

  handleMouseLeave(): void {
    this.activeMenu.set(null);
    this.activeSubCategory.set(null);
  }

  handleSubCategoryEnter(subCategory: SubCategory, event: MouseEvent): void {
    this.activeSubCategory.set(subCategory);
    const target = event.currentTarget as HTMLElement;
    this.zone.runOutsideAngular(() => {
      gsap.to(this.subCategoryPill.nativeElement, {
        top: target.offsetTop,
        height: target.offsetHeight,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  }

  handleSubCategoryListLeave(): void {
    this.zone.runOutsideAngular(() => {
      gsap.to(this.subCategoryPill.nativeElement, {
        opacity: 0,
        duration: 0.2,
      });
    });
  }

  closeMegaMenu(): void {
    this.activeMenu.set(null);
  }

  // --- Lógica de Animaciones GSAP ---
  private animateMegaMenuIn(): void {
    const subCategoryElements = this.subCategoryLinks.map(
      (el) => el.nativeElement
    );
    gsap.fromTo(
      subCategoryElements,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
      }
    );
    this.animatePreviewCards();
  }

  private animatePreviewCards(): void {
    const previewCardElements = this.previewCards.map((el) => el.nativeElement);
    gsap.fromTo(
      previewCardElements,
      { opacity: 0, scale: 0.98 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.07,
        ease: 'power2.out',
      }
    );
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
          yPercent: -60,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.inOut',
        });

        gsap.to(pillEl, {
          x: linkEl.offsetLeft,
          width: linkEl.offsetWidth,
          opacity: 1,
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
        backgroundColor: 'var(--pastel-pink)',
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

  openSubCategoryModal(event: MouseEvent, subCategory: SubCategory): void {
    event.preventDefault(); // Previene la navegación
    event.stopPropagation(); // Detiene otros clics

    // Abre el modal con los datos de la subcategoría actual
    this.productModalService.open({
      title: subCategory.name,
      products: subCategory.products,
    });

    this.closeMegaMenu(); // Cierra el mega menú
  }
}
