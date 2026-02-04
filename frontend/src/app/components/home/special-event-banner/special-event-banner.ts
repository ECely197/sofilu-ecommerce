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

// Registrar módulos globalmente
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && this.events.length > 0) {
      this.initSwiper();
    }
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
  }

  private initSwiper() {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        const container = this.el.nativeElement.querySelector('.swiper');
        if (!container) return;

        if (this.swiperInstance) this.swiperInstance.destroy(true, true);

        this.swiperInstance = new Swiper(container, {
          modules: [Autoplay, EffectFade, Pagination],
          observer: true,
          observeParents: true,
          effect: 'fade',
          fadeEffect: { crossFade: true },
          speed: 1500,
          loop: this.events.length > 1,
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
          },
          allowTouchMove: this.events.length > 1,
        });
      }, 50);
    });
  }

  scrollToProducts(event: SpecialEvent): void {
    if (!event.linkedProducts || event.linkedProducts.length === 0) return;
    const product = event.linkedProducts[0];

    const category =
      product.categories && product.categories.length > 0
        ? (product.categories[0] as any)
        : null;

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
