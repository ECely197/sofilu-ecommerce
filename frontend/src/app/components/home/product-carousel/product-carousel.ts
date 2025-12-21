import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../interfaces/product.interface';
import { ProductCard } from '../../product-card/product-card';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { HostListener } from '@angular/core';
import { ScrollManagerService } from '../../../services/scroll-manager.service';

Swiper.use([Navigation]);

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
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
export class ProductCarousel implements OnInit, AfterViewInit {
  @Input() title: string = '';
  @Input() products: Product[] = [];
  @Input() categorySlug: string = '';

  private el = inject(ElementRef);
  uniqueId = `carousel-${Math.random().toString(36).substring(2, 9)}`;
  private scrollManager = inject(ScrollManagerService);

  isExpanded = signal(false);
  private swiperInstance: Swiper | undefined;

  ngAfterViewInit() {
    // Inicialización robusta
    setTimeout(() => this.initSwiper(), 0);
  }

  private initSwiper(): void {
    const swiperContainer = this.el.nativeElement.querySelector('.swiper');
    if (!swiperContainer) return;

    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
    
    // Buscamos los botones usando el ID único de este carrusel
    const nextEl = this.el.nativeElement.querySelector(`.swiper-button-next.${this.uniqueId}`);
    const prevEl = this.el.nativeElement.querySelector(`.swiper-button-prev.${this.uniqueId}`);

    this.swiperInstance = new Swiper(swiperContainer, {
      // Configuración de slides múltiples
      slidesPerView: 1.2,
      spaceBetween: 20,
      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },
      breakpoints: {
        640: { slidesPerView: 2.2, spaceBetween: 20 },
        1024: { slidesPerView: 3.2, spaceBetween: 30 },
        1300: { slidesPerView: 4, spaceBetween: 30 }, // 4 productos en desktop grande
      },
    });
  }

  ngOnInit(): void {
    this.scrollManager.categoryScrollRequest$.subscribe((slug) => {
      if (this.categorySlug === slug) {
        this.scrollToAndExpand();
      }
    });
  }

  private scrollToAndExpand(): void {
    // Hacemos scroll al elemento nativo del componente (host)
    this.el.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center', // Centramos el carrusel en la pantalla
    });

    setTimeout(() => {
      this.isExpanded.set(true);
    }, 500);
  }

  toggleExplorer(): void {
    this.isExpanded.update((expanded) => !expanded);
  }
}