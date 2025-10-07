import {
  Component,
  Input,
  AfterViewInit,
  inject,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialEvent } from '../../../services/special-event.service';
import { ProductCard } from '../../product-card/product-card';
import { RouterLink } from '@angular/router';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

Swiper.use([Navigation]);

@Component({
  selector: 'app-special-event-banner',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './special-event-banner.html',
  styleUrls: ['./special-event-banner.scss'],
})
export class SpecialEventBanner implements AfterViewInit {
  @Input() event: SpecialEvent | null = null;

  private el = inject(ElementRef);
  uniqueId = `event-carousel-${Math.random().toString(36).substring(2, 9)}`;

  ngAfterViewInit(): void {
    // Solo inicializamos Swiper si el componente tiene un evento
    if (this.event) {
      // Usamos un timeout para asegurar que el @if se haya renderizado
      setTimeout(() => {
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
      }, 0);
    }
  }
}
