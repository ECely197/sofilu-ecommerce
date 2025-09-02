import { Component, Input, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../interfaces/product.interface';
import { ProductCard } from '../../product-card/product-card';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules'; // Importamos el módulo de navegación

Swiper.use([Navigation]); // Activamos el módulo

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
})
export class ProductCarousel implements AfterViewInit {
  // ¡DEFINIMOS LOS INPUTS!
  @Input() title: string = '';
  @Input() products: Product[] = [];
  @Input() categorySlug: string = '';

  // Creamos un ID único para cada instancia del carrusel
  uniqueId = `carousel-${Math.random().toString(36).substring(2, 9)}`;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
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
}
