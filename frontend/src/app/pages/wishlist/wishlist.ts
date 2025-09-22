/**
 * @fileoverview Componente de la Página de la Lista de Deseos.
 * Muestra los productos que el usuario ha añadido a su lista de deseos.
 * Obtiene los datos directamente del `WishlistService`.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  query,
  stagger,
  style,
  animate,
} from '@angular/animations';
import { RippleDirective } from '../../directives/ripple'; // Directiva para efecto ripple

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink, RippleDirective], // Se añade RippleDirective
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
  animations: [
    // Define una animación para la aparición de los elementos de la cuadrícula.
    trigger('gridAnimation', [
      transition(':enter', [
        // `query` selecciona los elementos `app-product-card` dentro del trigger.
        query(
          'app-product-card',
          [
            // Estado inicial: invisibles y ligeramente más pequeños.
            style({ opacity: 0, transform: 'scale(0.9)' }),
            // `stagger` aplica la animación a cada elemento con un pequeño retraso (80ms).
            stagger(80, [
              animate(
                '350ms ease-out',
                style({ opacity: 1, transform: 'scale(1)' })
              ),
            ]),
          ],
          { optional: true }
        ), // `optional: true` previene errores si no hay elementos que animar.
      ]),
    ]),
  ],
})
export class WishlistComponent {
  /**
   * Inyecta el `WishlistService` y lo hace público para que la plantilla (HTML)
   * pueda acceder directamente a sus signals (`wishlistProducts`).
   * Este es un patrón muy limpio y eficiente con Signals.
   */
  public wishlistService = inject(WishlistService);
}
