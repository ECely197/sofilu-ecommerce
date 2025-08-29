// Contenido completo para: src/app/pages/admin/order-list/order-list.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';
// En el futuro, crearemos una interfaz robusta para Order
// import { Order } from '../../../interfaces/order.interface';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
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
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders = signal<any[]>([]); // Usamos 'any' por ahora, pero lo ideal sería una interfaz 'Order'
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading.set(true);
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los pedidos:', err);
        this.isLoading.set(false);
      },
    });
  }

  deleteOrder(orderId: string): void {
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar este pedido permanentemente?'
      )
    ) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.orders.update((currentOrders) =>
            currentOrders.filter((order) => order._id !== orderId)
          );
        },
        error: (err) => this.toastService.show('Error al eliminar el pedido.'),
      });
    }
  }
}
