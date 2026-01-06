import {
  Component,
  OnInit,
  inject,
  signal,
  AfterViewInit,
  NgZone,
  ElementRef,
  ViewChildren,
  QueryList,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Componentes
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products';
import { ProductCarousel } from '../../components/home/product-carousel/product-carousel';
import { HowToBuy } from '../../components/how-to-buy/how-to-buy';
import { SplitText } from 'gsap/SplitText';
import { SpecialEventBanner } from '../../components/home/special-event-banner/special-event-banner';
import { CreateGiftCta } from '../../components/home/create-gift-cta/create-gift-cta';
import { PaymentMethods } from '../../components/home/payment-methods/payment-methods';
import { WorkWithUs } from '../../components/home/work-with-us/work-with-us';
import { StoreInfo } from '../../components/home/store-info/store-info';
import { CustomerExperience } from '../../components/home/customer-experience/customer-experience';
import { ExtraInfo } from '../../components/home/extra-info/extra-info';

// Servicios y Tipos
import { ProductServices } from '../../services/product';
import { CategoryService, Category } from '../../services/category.service';
import { Product } from '../../interfaces/product.interface';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  SpecialEvent,
  SpecialEventService,
} from '../../services/special-event.service';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

interface ProductsByCategory {
  name: string;
  slug: string;
  products: Product[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CategoriesSection,
    ProductCarousel,
    HowToBuy,
    SpecialEventBanner,
    CreateGiftCta,
    PaymentMethods,
    WorkWithUs,
    StoreInfo,
    ExtraInfo,
    FeaturedProductsComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private productService = inject(ProductServices);
  private categoryService = inject(CategoryService);
  private zone = inject(NgZone);
  private specialEventService = inject(SpecialEventService);
  private el = inject(ElementRef);

  // Signals para los datos
  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  productsByCategory = signal<ProductsByCategory[]>([]);
  activeEvent = signal<SpecialEvent | null>(null);

  private lenis: Lenis | null = null;

  ngOnInit() {
    // Obtenemos los datos iniciales
    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));
    this.productService
      .getAllFeaturedProducts()
      .subscribe((prods) => this.featuredProducts.set(prods));

    // Obtenemos los productos para cada categoría
    this.categoryService
      .getCategories()
      .pipe(
        switchMap((categories) => {
          const filteredCategories = categories.filter(
            (cat) => cat.slug !== 'plumones'
          ); // Filtra categorías si es necesario
          if (filteredCategories.length === 0) {
            return of({ productArrays: [], categories: [] });
          }

          const productRequests = filteredCategories.map((cat) =>
            this.productService.getProductsByCategory(cat.slug)
          );

          return forkJoin(productRequests).pipe(
            switchMap((productArrays) =>
              of({ productArrays, categories: filteredCategories })
            )
          );
        })
      )
      .subscribe((result) => {
        const groupedProducts: ProductsByCategory[] = [];
        result.productArrays.forEach((products, index) => {
          if (products.length > 0) {
            const category = result.categories[index];
            groupedProducts.push({
              name: `Novedades en ${category.name}`,
              slug: category.slug,
              products: products,
            });
          }
        });
        this.productsByCategory.set(groupedProducts);
      });

    this.specialEventService.getActiveEvent().subscribe((event) => {
      this.activeEvent.set(event);
    });
  }

  @ViewChildren('animateSection') sections!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    // Configuramos el observador para la animación de entrada
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Solo animar una vez
          }
        });
      },
      { threshold: 0.15 }
    ); // Se activa cuando el 15% del elemento es visible

    // Observamos cada sección marcada
    this.sections.changes.subscribe(() => {
      this.sections.forEach((sec) => observer.observe(sec.nativeElement));
    });

    // Primera carga manual
    setTimeout(() => {
      const elements = this.el.nativeElement.querySelectorAll('.fade-up');
      elements.forEach((el: HTMLElement) => observer.observe(el));
    }, 100);
  }

  /**
   * Inicializa las animaciones de scroll para las secciones de la página.
   */
  private initScrollAnimations(): void {
    this.zone.runOutsideAngular(() => {
      // --- Animación para las tarjetas de secciones ---
      const sectionCards = gsap.utils.toArray(
        'app-categories-section .card, app-featured-products .card, app-product-carousel .card, app-how-to-buy .card'
      ) as HTMLElement[];

      sectionCards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            y: 100, // Empieza 100px más abajo
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1, // Una duración más larga para un efecto más suave
            ease: 'power4.out', // Un "easing" más expresivo
            scrollTrigger: {
              trigger: card,
              start: 'top 90%', // Se activa un poco más tarde para que se note más
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // --- ¡NUEVO! Animación Parallax para la imagen del Hero ---
      const heroImage = document.querySelector(
        '.hero-background img'
      ) as HTMLElement;
      if (heroImage) {
        gsap.to(heroImage, {
          yPercent: 0, // Mueve la imagen hacia abajo un 30% de su propia altura
          ease: 'none', // Sin "easing" para que el movimiento sea lineal con el scroll
          scrollTrigger: {
            trigger: '.hero-card', // El trigger es la tarjeta completa del Hero
            start: 'top top', // Empieza cuando la parte superior de la tarjeta toca la parte superior de la ventana
            end: 'bottom top', // Termina cuando la parte inferior de la tarjeta toca la parte superior de la ventana
            scrub: true, // ¡ESTA ES LA CLAVE DEL PARALLAX! "Friega" la animación al scroll
          },
        });
      }

      // --- ¡NUEVO! Animación para el título del Hero ---
      const heroTitle = document.querySelector('.hero-title') as HTMLElement;
      if (heroTitle) {
        // Usamos SplitText para animar letra por letra
        const split = new SplitText(heroTitle, { type: 'chars' });

        gsap.from(split.chars, {
          y: 0,
          opacity: 0,
          stagger: 0.03, // Un pequeño retraso entre cada letra
          duration: 1,
          ease: 'power4.out',
        });
      }
    });

    const bannerBg = document.querySelector('.banner-background');
    if (bannerBg) {
      gsap.to(bannerBg, {
        y: '20%', // Mueve el fondo hacia abajo un 20%
        ease: 'none',
        scrollTrigger: {
          trigger: '.event-banner-container',
          start: 'top bottom', // Empieza cuando la parte superior del banner toca la parte inferior de la ventana
          end: 'bottom top', // Termina cuando la parte inferior del banner toca la parte superior de la ventana
          scrub: true, // "Friega" la animación al scroll
        },
      });
    }
  }
}
