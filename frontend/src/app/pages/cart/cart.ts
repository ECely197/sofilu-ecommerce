import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  animations: [
    trigger('itemAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, height: 0, transform: 'translateX(-30px)' }),
          stagger(100, [
            animate('350ms ease-out', style({ opacity: 1, height: '*', transform: 'none' }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('300ms ease-in', style({ opacity: 0, height: 0, transform: 'translateX(30px)' }))
        ], { optional: true })
      ])
    ]),
    trigger('flash', [
      transition('* => updated', [
        style({
          backgroundColor: 'var(--pastel-pink)',
          color: 'white',
          transform: 'scale(1.05)'
        }),
        animate('400ms ease-out')
      ])
    ])
  ],

})
export class Cart {
  public cartService = inject(CartService);
  
  // Creamos un signal para controlar el estado de la animación del total
  totalAnimationState = signal<'default' | 'updated'>('default');
  
  constructor() {
    // Usamos un 'effect' para reaccionar a los cambios del subtotal
    effect(() => {
      // Cada vez que el subtotal() cambie...
      this.cartService.subTotal();
      
      // Disparamos la animación
      this.totalAnimationState.set('updated');

      // Y la volvemos a su estado original después de un momento
      setTimeout(() => this.totalAnimationState.set('default'), 400);
    }, { allowSignalWrites: true }); // Permitimos que el efecto modifique signals
  }
}
