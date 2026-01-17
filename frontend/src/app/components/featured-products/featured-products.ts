import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { ProductCard } from '../product-card/product-card';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

Swiper.use([Navigation]);

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './featured-products.html',
  styleUrls: ['./featured-products.scss'],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0px',
          overflow: 'hidden',
          opacity: 0,
          paddingTop: '0',
          paddingBottom: '0',
        })
      ),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('expanded <=> collapsed', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
  ],
})
export class FeaturedProductsComponent implements AfterViewInit {
  @Input() products: Product[] = [];

  private el = inject(ElementRef);
  uniqueId = `featured-${Math.random().toString(36).substring(2, 9)}`;
  isExpanded = signal(false);
  private swiperInstance: Swiper | undefined;

  constructor() {
    effect(() => {
      if (this.products.length > 0) {
        // Damos un poco más de tiempo para asegurar que el DOM esté pintado
        setTimeout(() => this.initSwiper(), 100);
      }
    });
  }

  ngAfterViewInit() {}

  private initSwiper(): void {
    const swiperContainer = this.el.nativeElement.querySelector('.swiper');
    if (!swiperContainer) return;

    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }

    const nextEl = this.el.nativeElement.querySelector(
      `.swiper-button-next.${this.uniqueId}`
    );
    const prevEl = this.el.nativeElement.querySelector(
      `.swiper-button-prev.${this.uniqueId}`
    );

    this.swiperInstance = new Swiper(swiperContainer, {
      // --- CONFIGURACIÓN ROBUSTA (Igual a ProductCarousel) ---
      // En móvil mostramos 1 tarjeta y un pedacito de la siguiente (1.3)
      // Esto le indica al usuario visualmente que puede deslizar.
      slidesPerView: 1.3,
      spaceBetween: 16,
      centeredSlides: false, // Alineado a la izquierda
      observer: true, // Importante: Observa cambios en el DOM
      observeParents: true,

      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },

      breakpoints: {
        500: { slidesPerView: 2.2, spaceBetween: 20 },
        768: { slidesPerView: 3.2, spaceBetween: 24 }, // Tablet
        1024: { slidesPerView: 3.5, spaceBetween: 30 }, // Desktop
        1300: { slidesPerView: 4, spaceBetween: 30 }, // Pantalla grande
      },
    });
  }

  toggleExplorer(): void {
    this.isExpanded.update((expanded) => !expanded);
  }
}
