import {
  Component,
  Input,
  inject,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpecialEvent } from '../../../services/special-event.service';
import { RippleDirective } from '../../../directives/ripple';
import Swiper from 'swiper';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';

// Registrar módulos de Swiper
Swiper.use([Autoplay, EffectFade, Pagination]);

@Component({
  selector: 'app-special-event-banner',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './special-event-banner.html',
  styleUrls: ['./special-event-banner.scss'],
})
export class SpecialEventBanner implements OnDestroy {
  // Ahora recibe un array de eventos
  @Input() events: SpecialEvent[] = [];

  private router = inject(Router);
  private el = inject(ElementRef);
  private zone = inject(NgZone);
  private swiperInstance: Swiper | undefined;

  constructor() {
    effect(() => {
      // Si llegan eventos, iniciamos el slider
      if (this.events.length > 0) {
        // Timeout para asegurar que el HTML se renderizó
        setTimeout(() => this.initSwiper(), 50);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
  }

  private initSwiper() {
    this.zone.runOutsideAngular(() => {
      const container = this.el.nativeElement.querySelector('.swiper');
      if (!container) return;

      if (this.swiperInstance) this.swiperInstance.destroy(true, true);

      this.swiperInstance = new Swiper(container, {
        modules: [Autoplay, EffectFade, Pagination],
        effect: 'fade', // Transición de desvanecimiento elegante
        fadeEffect: { crossFade: true },
        speed: 1000, // Transición lenta (1 segundo)
        loop: this.events.length > 1, // Loop solo si hay más de 1
        autoplay: {
          delay: 5000, // 5 segundos por slide
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
          dynamicBullets: true, // Puntos dinámicos si hay muchos
        },
      });
    });
  }

  scrollToProducts(event: SpecialEvent): void {
    if (!event.linkedProducts || event.linkedProducts.length === 0) return;

    // Obtenemos el slug de la categoría del primer producto vinculado
    // (Asumiendo que el populate del backend funcionó)
    const category = event.linkedProducts[0].category as any;
    const categorySlug = category?.slug;

    if (!categorySlug) return;

    if (this.router.url === '/') {
      this.scrollToCategory(categorySlug);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToCategory(categorySlug), 100);
      });
    }
  }

  private scrollToCategory(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
