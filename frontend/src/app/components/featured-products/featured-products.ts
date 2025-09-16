import {
  Component,
  Input,
  inject,
  signal,
  computed,
  ElementRef,
  AfterViewInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { ProductCard } from '../product-card/product-card';
import { ProductModalService } from '../../services/product-modal.service';
import Swiper from 'swiper';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './featured-products.html',
  styleUrl: './featured-products.scss',
})
export class FeaturedProductsComponent implements AfterViewInit {
  private productModalService = inject(ProductModalService);
  private el = inject(ElementRef);
  private swiperInstance: Swiper | undefined;

  // ¡RENOMBRAMOS ESTE SIGNAL!
  productsSignal = signal<Product[]>([]);

  @Input()
  set products(value: Product[]) {
    this.productsSignal.set(value);
  }

  constructor() {
    effect(() => {
      const products = this.productsSignal();
      if (products.length > 0 && this.swiperInstance) {
        this.swiperInstance.update();
      } else if (products.length > 0) {
        setTimeout(() => this.initSwiper(), 0);
      }
    });
  }

  ngAfterViewInit() {
    if (this.productsSignal().length > 0) {
      this.initSwiper();
    }
  }

  private initSwiper() {
    if (this.swiperInstance || window.innerWidth >= 768) return;

    this.swiperInstance = new Swiper(
      this.el.nativeElement.querySelector('.swiper'),
      {
        slidesPerView: 'auto',
        spaceBetween: 16,
        freeMode: true,
      }
    );
  }

  openExplorer(): void {
    const products = this.productsSignal();
    if (products.length > 0) {
      this.productModalService.open({
        title: 'Nuestros Favoritos',
        products: products,
      });
    }
  }
}
