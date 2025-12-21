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
import { ScrollManagerService } from '../../services/scroll-manager.service';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, AfterViewInit {
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
  navItems = signal<NavItem[]>([]);
  activeMenu = signal<NavItem | null>(null);
  activeSubCategory = signal<SubCategory | null>(null);

  @ViewChildren('navLink') navLinks!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;
  @ViewChild('navContainer') navContainer!: ElementRef<HTMLElement>;
  @ViewChild('profileMenu') profileMenu!: ElementRef<HTMLElement>;
  @ViewChild('subCategoryPill') subCategoryPill!: ElementRef<HTMLElement>;
  @ViewChildren('subCategoryLink') subCategoryLinks!: QueryList<ElementRef>;
  @ViewChildren('previewCard') previewCards!: QueryList<ElementRef>;

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
      if (this.navContainer) {
        gsap.from(this.navContainer.nativeElement.closest('.header-pill'), {
          y: -100,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        });
      }
      this.navLinks.changes.subscribe(() => {
        setTimeout(() => this.setupNavAnimations(), 50);
      });
      setTimeout(() => this.setupNavAnimations(), 100);
    });
  }

  // --- ANIMACIÓN DE SCROLL ---
  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollY = window.scrollY;
    const headerElement = this.elementRef.nativeElement.querySelector('.sofilu-header');
    
    if (headerElement) {
      if (scrollY > 50) {
        headerElement.classList.add('is-scrolled');
      } else {
        headerElement.classList.remove('is-scrolled');
      }
    }
  }

  // --- LÓGICA DE PÍLDORA RESTAURADA (Con offsetLeft) ---
  setupNavAnimations(): void {
    if (!this.navPill || !this.navLinks) return;
    
    const pillEl = this.navPill.nativeElement;

    this.navLinks.forEach((linkRef) => {
      const linkWrapperEl = linkRef.nativeElement;
      const linkAnchorEl = linkWrapperEl.querySelector('.nav-link') as HTMLElement;

      if (!linkAnchorEl) return;

      const originalText = linkAnchorEl.querySelector('.nav-text-original');
      const revealText = linkAnchorEl.querySelector('.nav-text-reveal');
      
      if (originalText && revealText) {
        // Inicializamos SplitText solo una vez si es posible
        const splitOriginal = new SplitText(originalText, { type: 'chars' });
        const splitReveal = new SplitText(revealText, { type: 'chars' });
        
        // Estado inicial
        gsap.set(splitReveal.chars, { yPercent: 100 });

        // --- HOVER ENTRADA ---
        linkWrapperEl.addEventListener('mouseenter', () => {
          // Mover Píldora
          const targetX = linkWrapperEl.offsetLeft;
          const targetWidth = linkWrapperEl.offsetWidth;
          gsap.to(pillEl, {
            x: targetX,
            width: targetWidth,
            opacity: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
          });

          // Animar Texto a BLANCO
          gsap.to(splitOriginal.chars, { yPercent: -150, stagger: 0.02, duration: 0.3, ease: 'power2.inOut', overwrite: true });
          gsap.to(splitReveal.chars, { yPercent: -100, stagger: 0.02, duration: 0.3, ease: 'power2.inOut', overwrite: true });
        });

        // --- HOVER SALIDA ---
        linkWrapperEl.addEventListener('mouseleave', () => {
          // Si NO es activo, volver a negro
          if (!linkAnchorEl.classList.contains('active')) {
            gsap.to(splitOriginal.chars, { yPercent: 0, stagger: 0.02, duration: 0.3, ease: 'power2.inOut', overwrite: true });
            gsap.to(splitReveal.chars, { yPercent: 100, stagger: 0.02, duration: 0.3, ease: 'power2.inOut', overwrite: true });
          }
          // Volver píldora al activo
          this.updatePillToActiveLink();
        });
      }
    });

    this.updatePillToActiveLink();
  }

  updatePillToActiveLink(): void {
    if (!this.navPill || !this.navLinks) return;

    const activeLinkWrapper = this.navLinks.find((linkRef) => {
      const anchor = linkRef.nativeElement.querySelector('a');
      return anchor?.classList.contains('active') ?? false;
    });

    if (activeLinkWrapper) {
      // 1. Mover la Píldora al activo
      const el = activeLinkWrapper.nativeElement;
      const targetX = el.offsetLeft;
      const targetWidth = el.offsetWidth;

      gsap.to(this.navPill.nativeElement, {
        x: targetX,
        width: targetWidth,
        opacity: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.75)',
      });

      // 2. ¡AQUÍ ESTÁ LA SOLUCIÓN! Forzar el texto BLANCO en el activo
      // Aunque el mouse no esté encima, si es 'active', debe estar blanco.
      const activeAnchor = activeLinkWrapper.nativeElement.querySelector('.nav-link');
      if (activeAnchor) {
        const originalText = activeAnchor.querySelector('.nav-text-original');
        const revealText = activeAnchor.querySelector('.nav-text-reveal');
        
        if(originalText && revealText) {
           // Seleccionamos los divs creados por SplitText
           const charsOrig = originalText.querySelectorAll('div');
           const charsReveal = revealText.querySelectorAll('div');
           
           if(charsOrig.length && charsReveal.length) {
             gsap.to(charsOrig, { yPercent: -150, duration: 0.3, overwrite: true });
             gsap.to(charsReveal, { yPercent: 0, duration: 0.3, overwrite: true });
           }
        }
      }

    } else {
      gsap.to(this.navPill.nativeElement, { opacity: 0, duration: 0.3 });
    }

    // 3. Asegurar que los NO activos estén NEGROS
    // Esto arregla el caso donde cambias de un link a otro y el anterior se quedaba blanco.
    this.navLinks.forEach(wrapper => {
        if(wrapper !== activeLinkWrapper) {
            const anchor = wrapper.nativeElement.querySelector('.nav-link');
            if(anchor) {
                const originalText = anchor.querySelector('.nav-text-original');
                const revealText = anchor.querySelector('.nav-text-reveal');
                if(originalText && revealText) {
                   const charsOrig = originalText.querySelectorAll('div');
                   const charsReveal = revealText.querySelectorAll('div');
                   if(charsOrig.length) gsap.to(charsOrig, { yPercent: 0, duration: 0.3, overwrite: true });
                   if(charsReveal.length) gsap.to(charsReveal, { yPercent: 100, duration: 0.3, overwrite: true });
                }
            }
        }
    });
  }

  // --- MEGA MENÚ Y OTRAS FUNCIONES ---
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
      if (this.subCategoryPill) {
        gsap.to(this.subCategoryPill.nativeElement, {
          top: target.offsetTop,
          height: target.offsetHeight,
          opacity: 1,
          duration: 0.5, // Un poco más de tiempo para que se note el rebote
          // --- ¡AQUÍ ESTÁ LA MAGIA LÍQUIDA! ---
          ease: 'elastic.out(1, 0.75)', 
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
    if (this.router.url === '/') {
      this.scrollManager.requestScrollToCategory(subCategory.id);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollManager.requestScrollToCategory(subCategory.id), 100);
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

  closeMegaMenu(): void { this.activeMenu.set(null); }
  closeAllMenus(): void { this.isProfileMenuOpen.set(false); }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout().then(() => this.router.navigate(['/']));
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen.set(false);
  }
}