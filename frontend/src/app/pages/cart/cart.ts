// Contenido completo para: src/app/pages/cart/cart.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations'; // Importaciones para animación

import { CartService } from '../../services/cart';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class Cart {
  public cartService = inject(CartService);

  /**
   * Método público para permitir que la plantilla itere sobre las claves de un objeto.
   * @param obj El objeto sobre el que se va a iterar.
   * @returns Un array de strings con las claves del objeto.
   */
  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}
