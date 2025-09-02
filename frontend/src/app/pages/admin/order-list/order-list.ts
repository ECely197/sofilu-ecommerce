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
import { ConfirmationService } from '../../../services/confirmation.service';
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
  private confirmationService = inject(ConfirmationService);

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

  async deleteOrder(orderId: string): Promise<void> {
    // 2. Llamamos a nuestro servicio y esperamos (await) la respuesta
    const confirmed = await this.confirmationService.confirm({
      title: '¿Confirmar Eliminación?',
      message:
        '¿Estás seguro de que quieres eliminar este pedido de forma permanente? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar', // Texto del botón de confirmación
      cancelText: 'No, cancelar', // Texto del botón de cancelar
    });

    // 3. Si 'confirmed' es true (el usuario hizo clic en "Aceptar"), continuamos
    if (confirmed) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          // Actualizamos la lista local
          this.orders.update((currentOrders) =>
            currentOrders.filter((order) => order._id !== orderId)
          );
          // Usamos nuestro toast para la notificación de éxito
          this.toastService.show('Pedido eliminado con éxito.', 'success');
        },
        error: (err) => {
          this.toastService.show('Error al eliminar el pedido.', 'error');
        },
      });
    }
    // Si 'confirmed' es false, la función simplemente termina y no se hace nada.
  }
}
