import {
  Component,
  Input,
  inject,
  ElementRef,
  NgZone,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpecialEvent } from '../../../services/special-event.service';
import { RippleDirective } from '../../../directives/ripple';
import Swiper from 'swiper';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';

// Registrar módulos globalmente (por si acaso)
Swiper.use([Autoplay, EffectFade, Pagination]);

@Component({
  selector: 'app-special-event-banner',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './special-event-banner.html',
  styleUrls: ['./special-event-banner.scss'],
})
export class SpecialEventBanner implements OnChanges, OnDestroy {
  @Input() events: SpecialEvent[] = [];

  private router = inject(Router);
  private el = inject(ElementRef);
  private zone = inject(NgZone);
  private swiperInstance: Swiper | undefined;

  // Detectamos cuando llegan los datos del Home
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && this.events.length > 0) {
      // Reiniciamos el Swiper cuando los eventos cambian/llegan
      this.initSwiper();
    }
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
  }

  private initSwiper() {
    // Ejecutamos fuera de Angular para mejorar rendimiento
    this.zone.runOutsideAngular(() => {
      // Damos un pequeño respiro para que el HTML se pinte
      setTimeout(() => {
        const container = this.el.nativeElement.querySelector('.swiper');
        if (!container) return;

        // Si ya existe, lo destruimos para recrearlo limpio
        if (this.swiperInstance) this.swiperInstance.destroy(true, true);

        this.swiperInstance = new Swiper(container, {
          // Importante: pasar los módulos aquí también
          modules: [Autoplay, EffectFade, Pagination],

          // --- CONFIGURACIÓN DE AUTOPLAY CORREGIDA ---
          observer: true, // ¡CLAVE! Observa cambios en el DOM
          observeParents: true,
          effect: 'fade',
          fadeEffect: { crossFade: true },
          speed: 1500, // Transición suave (1.5 seg)
          loop: this.events.length > 1, // Solo loop si hay más de 1

          autoplay: {
            delay: 4000, // 4 segundos por banner
            disableOnInteraction: false, // No detener si el usuario toca
            pauseOnMouseEnter: false, // No pausar con el mouse (opcional)
          },

          pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
          },

          // Deshabilitar swipe si solo hay 1 evento
          allowTouchMove: this.events.length > 1,
        });
      }, 50);
    });
  }

  scrollToProducts(event: SpecialEvent): void {
    if (!event.linkedProducts || event.linkedProducts.length === 0) return;

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
