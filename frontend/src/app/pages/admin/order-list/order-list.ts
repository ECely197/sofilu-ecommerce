import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
} from 'rxjs/operators';

import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective, ReactiveFormsModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('50ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  orders = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchControl = new FormControl('');

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.isLoading.set(true);
          return this.orderService.searchOrders({ search: searchTerm || '' });
        }),
      )
      .subscribe({
        next: (data) => {
          this.orders.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al buscar pedidos:', err);
          this.isLoading.set(false);
        },
      });
  }

  async deleteOrder(orderId: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Pedido?',
      message: 'Esto borrará el registro permanentemente. ¿Estás seguro?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.orders.update((currentOrders) =>
            currentOrders.filter((order) => order._id !== orderId),
          );
          this.toastService.show('Pedido eliminado.', 'success');
        },
        error: () => this.toastService.show('Error al eliminar.', 'error'),
      });
    }
  }
}
