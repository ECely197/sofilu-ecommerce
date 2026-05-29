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
  isSearchExpanded = signal(false);

  navItems = signal<NavItem[]>([]);
  activeMenu = signal<NavItem | null>(null);
  activeSubCategory = signal<SubCategory | null>(null);

  @ViewChildren('navLink') navLinks!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('navPill') navPill!: ElementRef<HTMLElement>;

  private routerSub: Subscription | null = null;
  private splitTexts: SplitText[] = [];

  constructor() {}

  ngOnInit() {
    this.navigationService.getNavigationData()
      .pipe(
        // 'filter' se asegura de que solo continuemos si los datos no son null.
        filter((data): data is NavItem[] => data !== null) 
      )
      .subscribe((data) => {
        // El resto de tu código para filtrar 'complementos' y 'plumones'
        // puede ir aquí si todavía lo necesitas, o manejarlo directamente en la vista.
        this.navItems.set(data);

        // Ya no necesitas el segundo bloque de filtrado, el servicio ya entrega todo listo.
        // Solo necesitas configurar las animaciones después de recibir los datos.
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          // Un pequeño retraso para asegurar que el DOM se haya actualizado.
          setTimeout(() => this.setupNavAnimations(), 50); 
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
      '.mobile-floating-header',
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

  private animatePill(targetX: number, targetWidth: number): void {
    if (!this.navPill) return;
    const pillEl = this.navPill.nativeElement;
    
    // Si la píldora estaba invisible (opacity 0), la mostramos con un fade suave sin estiramiento
    const currentOpacity = parseFloat(gsap.getProperty(pillEl, 'opacity') as string) || 0;
    if (currentOpacity === 0) {
      gsap.set(pillEl, { x: targetX, width: targetWidth });
      gsap.to(pillEl, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      return;
    }

    const currentX = gsap.getProperty(pillEl, 'x') as number || 0;
    const delta = targetX - currentX;
    const dist = Math.abs(delta);

    if (dist > 10) {
      // Determinamos el factor de estiramiento ("liquid stretch") basado en la distancia
      const stretchVal = Math.min(dist * 0.3, 75);
      
      // Si va a la derecha: el inicio de la píldora se queda en currentX, y crece su ancho cubriendo la distancia
      // Si va a la izquierda: el inicio va a targetX, y su ancho se expande cubriendo la distancia hasta el viejo currentX
      const tempX = delta > 0 ? currentX : targetX;
      const currentWidth = parseFloat(gsap.getProperty(pillEl, 'width') as string) || targetWidth;
      const tempWidth = dist + (delta > 0 ? targetWidth : currentWidth) + stretchVal;

      // Fase 1: Estirar
      gsap.to(pillEl, {
        x: tempX,
        width: tempWidth,
        duration: 0.22,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: () => {
          // Fase 2: Contraer y asentar elásticamente en su destino final
          gsap.to(pillEl, {
            x: targetX,
            width: targetWidth,
            duration: 0.48,
            ease: 'elastic.out(1.1, 0.72)',
            overwrite: 'auto',
          });
        },
      });
    } else {
      // Movimiento corto, transición de acomodación simple
      gsap.to(pillEl, {
        x: targetX,
        width: targetWidth,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  }

  setupNavAnimations(): void {
    if (!this.navPill || !this.navLinks || window.innerWidth < 1024) return;
    this.revertSplitText();

    this.navLinks.forEach((linkRef) => {
      const linkWrapperEl = linkRef.nativeElement;
      const linkAnchorEl = linkWrapperEl.querySelector(
        '.nav-link',
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
          
          this.animatePill(targetX, targetWidth);

          gsap.to(splitOriginal.chars, {
            yPercent: -150,
            stagger: 0.015,
            duration: 0.35,
            ease: 'power3.out',
            overwrite: true,
          });
          gsap.to(splitReveal.chars, {
            yPercent: -100,
            stagger: 0.015,
            duration: 0.35,
            ease: 'power3.out',
            overwrite: true,
          });
        };

        linkWrapperEl.onmouseleave = () => {
          if (!linkAnchorEl.classList.contains('active')) {
            gsap.to(splitOriginal.chars, {
              yPercent: 0,
              stagger: 0.015,
              duration: 0.35,
              ease: 'power3.inOut',
              overwrite: true,
            });
            gsap.to(splitReveal.chars, {
              yPercent: 100,
              stagger: 0.015,
              duration: 0.35,
              ease: 'power3.inOut',
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

    const activeLinkWrapper = this.navLinks.find(
      (linkRef) =>
        linkRef.nativeElement
          .querySelector('a')
          ?.classList.contains('active') === true,
    );

    if (activeLinkWrapper) {
      const el = activeLinkWrapper.nativeElement;
      this.animatePill(el.offsetLeft, el.offsetWidth);

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
                duration: 0.35,
                ease: 'power3.out',
                overwrite: true,
              });
              gsap.to(charsReveal, {
                yPercent: -100,
                duration: 0.35,
                ease: 'power3.out',
                overwrite: true,
              });
            } else {
              gsap.to(charsOrig, {
                yPercent: 0,
                duration: 0.35,
                ease: 'power3.out',
                overwrite: true,
              });
              gsap.to(charsReveal, {
                yPercent: 100,
                duration: 0.35,
                ease: 'power3.out',
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

      console.log('Categoría actual:', item.subCategories[0].name);
      console.log(
        'Productos que llegaron del servicio:',
        item.subCategories[0].products,
      );

      // FIX: Posicionar la píldora rosa inmediatamente en el primer elemento
      setTimeout(() => {
        this.zone.runOutsideAngular(() => {
          const list =
            this.elementRef.nativeElement.querySelector('.sub-category-list');
          const firstLink = list?.querySelector('.sub-category-link');
          if (firstLink && this.subCategoryPill) {
            gsap.set(this.subCategoryPill.nativeElement, {
              top: firstLink.offsetTop,
              height: firstLink.offsetHeight,
              opacity: 1,
            });
          }
        });
      }, 0);
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
    // FIX MEJORADO: Cuando sacas el mouse de la lista, la píldora vuelve al elemento seleccionado
    // en lugar de desaparecer. Así el usuario siempre sabe en qué categoría está.
    this.zone.runOutsideAngular(() => {
      if (this.subCategoryPill) {
        const list =
          this.elementRef.nativeElement.querySelector('.sub-category-list');
        const activeLink = list?.querySelector('.sub-category-link.active');

        if (activeLink) {
          gsap.to(this.subCategoryPill.nativeElement, {
            top: (activeLink as HTMLElement).offsetTop,
            height: (activeLink as HTMLElement).offsetHeight,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
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
          100,
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
      this.isSearchExpanded.set(false);
      searchInput.blur();
    }
  }

  toggleSearch(event: MouseEvent, input: HTMLInputElement): void {
    event.stopPropagation();
    if (!this.isSearchExpanded()) {
      this.isSearchExpanded.set(true);
      setTimeout(() => input.focus(), 80);
    } else {
      const query = input.value.trim();
      if (query) {
        this.router.navigate(['/search'], { queryParams: { q: query } });
        input.value = '';
        this.isSearchExpanded.set(false);
      } else {
        this.isSearchExpanded.set(false);
      }
    }
  }

  onSearchBlur(input: HTMLInputElement): void {
    if (!input.value.trim()) {
      this.isSearchExpanded.set(false);
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
