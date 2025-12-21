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
        setTimeout(() => this.initSwiper(), 50);
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
    
    const nextEl = this.el.nativeElement.querySelector(`.swiper-button-next.${this.uniqueId}`);
    const prevEl = this.el.nativeElement.querySelector(`.swiper-button-prev.${this.uniqueId}`);

    this.swiperInstance = new Swiper(swiperContainer, {
      slidesPerView: 1.2,
      spaceBetween: 20,
      navigation: {
        nextEl: nextEl,
        prevEl: prevEl,
      },
      breakpoints: {
        640: { slidesPerView: 2.2, spaceBetween: 20 },
        1024: { slidesPerView: 3.2, spaceBetween: 30 },
        1300: { slidesPerView: 4, spaceBetween: 30 },
      },
    });
  }

  toggleExplorer(): void {
    this.isExpanded.update((expanded) => !expanded);
  }
}