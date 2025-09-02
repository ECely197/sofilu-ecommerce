import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { ProductCard } from '../product-card/product-card';
import {
  trigger,
  transition,
  query,
  stagger,
  style,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './featured-products.html',
  styleUrl: './featured-products.scss',
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query(
          'app-product-card',
          [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
              animate(
                '0.6s cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class FeaturedProductsComponent {
  @Input() products: Product[] = [];
}
