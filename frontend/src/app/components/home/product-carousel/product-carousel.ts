import { Component, Input, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../interfaces/product.interface';
import { ProductCard } from '../../product-card/product-card';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { ProductModalService } from '../../../services/product-modal.service';

Swiper.use([Navigation]); // Activamos el módulo

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
})
export class ProductCarousel implements AfterViewInit {
  // --- @Inputs (sin cambios) ---
  @Input() title: string = '';
  @Input() products: Product[] = []; // Recibimos la lista COMPLETA de productos
  @Input() categorySlug: string = '';

  uniqueId = `carousel-${Math.random().toString(36).substring(2, 9)}`;

  // ¡Inyectamos el servicio del modal!
  constructor(
    private el: ElementRef,
    private productModalService: ProductModalService
  ) {}

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

  openExplorer(): void {
    if (this.products && this.products.length > 0) {
      this.productModalService.open({
        title: this.title,
        products: this.products, // Pasamos la lista completa de productos al modal
      });
    }
  }
}
