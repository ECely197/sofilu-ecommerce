// Contenido completo para: src/app/pages/admin/order-detail/order-detail.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateY(10px)' })
        ),
      ]),
    ]),
  ],
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  order = signal<any | null>(null);
  isLoading = signal<boolean>(true);

  statusForm!: FormGroup;
  orderStatuses = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

  ngOnInit() {
    // Inicializamos el formulario vacío para evitar errores
    this.statusForm = new FormGroup({
      status: new FormControl('', Validators.required),
    });

    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.fetchOrder(orderId);
    } else {
      this.isLoading.set(false);
      // Aquí podrías redirigir o mostrar un mensaje de error
    }
  }

  fetchOrder(orderId: string): void {
    this.isLoading.set(true);
    this.orderService.getOrderById(orderId).subscribe({
      next: (data) => {
        this.order.set(data);
        // Rellenamos el formulario con el valor del pedido cargado
        this.statusForm.patchValue({ status: data.status });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el pedido:', err);
        this.isLoading.set(false);
      },
    });
  }

  updateStatus(): void {
    if (this.statusForm.invalid || !this.order()) {
      return;
    }

    const newStatus = this.statusForm.value.status;
    const currentOrder = this.order();

    if (newStatus && currentOrder) {
      this.orderService
        .updateOrderStatus(currentOrder._id, newStatus)
        .subscribe({
          next: (updatedOrder) => {
            this.order.set(updatedOrder);
            this.statusForm.patchValue({ status: updatedOrder.status });
            this.toastService.show('¡Estado del pedido actualizado con éxito!');
          },
          error: (err) => {
            console.error('Error al actualizar el estado:', err);
            this.toastService.show(
              'No se pudo actualizar el estado del pedido.'
            );
          },
        });
    }
  }

  public objectKeys(obj: object): string[] {
    if (!obj) {
      return []; // Añadimos una guarda para evitar errores si el objeto es nulo
    }
    return Object.keys(obj);
  }
}
