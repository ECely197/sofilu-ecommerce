import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  inject,
  signal,
  OnInit,
  HostListener,
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
  selector: 'app-featured-products', // <-- El único cambio real es este selector
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
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'scale(0.8)' })
        ),
      ]),
    ]),
  ],
})
export class FeaturedProductsComponent implements AfterViewInit {
  // --- @Inputs ---
  @Input() products: Product[] = [];

  // --- Estado Interno ---
  private el = inject(ElementRef);
  uniqueId = `featured-${Math.random().toString(36).substring(2, 9)}`;
  isExpanded = signal(false);
  isFloating = signal(false);
  private timeoutId: any;
  private swiperInstance: Swiper | undefined;

  constructor() {
    effect(() => {
      if (this.products.length > 0) {
        setTimeout(() => this.initOrUpdateSwiper(), 0);
      }
    });
  }

  ngAfterViewInit() {}

  private initOrUpdateSwiper(): void {
    const swiperContainer = this.el.nativeElement.querySelector('.swiper');
    if (!swiperContainer) return;

    if (this.swiperInstance) {
      this.swiperInstance.update();
      return;
    }

    this.swiperInstance = new Swiper(swiperContainer, {
      slidesPerView: 2,
      spaceBetween: 16,
      navigation: {
        nextEl: `.swiper-button-next.${this.uniqueId}`,
        prevEl: `.swiper-button-prev.${this.uniqueId}`,
      },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        1024: { slidesPerView: 4, spaceBetween: 24 },
      },
    });
  }

  toggleExplorer(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isExpanded()) return;
    this.isFloating.set(true);
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.isFloating.set(false);
    }, 150);
  }
}
