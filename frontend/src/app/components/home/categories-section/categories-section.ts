import {
  Component,
  Input,
  signal,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Category } from '../../../services/category.service';
import Swiper from 'swiper'; // ¡Importamos Swiper!
import { Navigation } from 'swiper/modules';

Swiper.use([Navigation]);

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection implements AfterViewInit {
  @Input() categories: Category[] = [];

  uniqueId = `carousel-cat-${Math.random().toString(36).substring(2, 9)}`;

  constructor(private el: ElementRef) {}

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
}
