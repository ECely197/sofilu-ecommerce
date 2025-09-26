import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  inject,
  signal,
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
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })), // Altura automática
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
export class ProductCarousel implements AfterViewInit {
  // --- @Inputs ---
  @Input() title: string = '';
  @Input() products: Product[] = [];
  @Input() categorySlug: string = '';

  // --- Estado Interno ---
  private el = inject(ElementRef);
  uniqueId = `carousel-${Math.random().toString(36).substring(2, 9)}`;

  // --- ¡SIGNAL's! ---
  isExpanded = signal(false);
  isFloating = signal(false);
  private scrollContainer: HTMLElement | null = null;
  private timeoutId: any;

  ngAfterViewInit() {
    // La inicialización de Swiper no cambia
    new Swiper(this.el.nativeElement.querySelector('.swiper'), {
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

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event): void {
    if (!this.isExpanded()) {
      return;
    }

    this.isFloating.set(true);

    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.isFloating.set(false);
    }, 150);
  }
}
