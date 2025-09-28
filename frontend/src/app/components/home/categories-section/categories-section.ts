import {
  Component,
  Input,
  signal,
  AfterViewInit,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Category } from '../../../services/category.service';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { ScrollManagerService } from '../../../services/scroll-manager.service';

Swiper.use([Navigation]);

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection implements AfterViewInit {
  @Input() categories: Category[] = [];
  private el = inject(ElementRef);
  private router = inject(Router);
  private scrollManager = inject(ScrollManagerService);

  uniqueId = `carousel-cat-${Math.random().toString(36).substring(2, 9)}`;

  ngAfterViewInit() {
    new Swiper(this.el.nativeElement.querySelector('.swiper'), {
      slidesPerView: 'auto',
      spaceBetween: 24,
      freeMode: true,
      // ¡NUEVA CONFIGURACIÓN DE NAVEGACIÓN!
      navigation: {
        nextEl: `.swiper-button-next.${this.uniqueId}`,
        prevEl: `.swiper-button-prev.${this.uniqueId}`,
      },
    });
  }

  handleCategoryClick(event: MouseEvent, category: Category): void {
    event.preventDefault();

    if (this.router.url === '/') {
      this.scrollManager.requestScrollToCategory(category.slug);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(
          () => this.scrollManager.requestScrollToCategory(category.slug),
          100
        );
      });
    }
  }
}
