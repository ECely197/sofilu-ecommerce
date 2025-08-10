import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';
import { trigger, transition, query, stagger, style, animate } from '@angular/animations';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
  animations: [
    trigger('gridAnimation', [
      // Animación de entrada
      transition(':enter', [
        query('app-product-card', [
          style({ opacity: 0, transform: 'scale(0.9)' }),
          stagger(80, [
            animate('350ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ], { optional: true }) // 'optional: true' evita errores si no hay items
      ]),
      // Animación de salida
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class WishlistComponent {
  // Simplemente inyectamos el servicio y lo hacemos público
  public wishlistService = inject(WishlistService);
}