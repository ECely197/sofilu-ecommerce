// Contenido completo para: src/app/pages/admin/order-detail/order-detail.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
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
            alert('¡Estado del pedido actualizado con éxito!');
          },
          error: (err) => {
            console.error('Error al actualizar el estado:', err);
            alert('No se pudo actualizar el estado del pedido.');
          },
        });
    }
  }

  downloadInvoice(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.orderService.getOrderInvoice(currentOrder._id).subscribe({
      next: (blob) => {
        // Creamos una URL temporal para el archivo Blob
        const url = window.URL.createObjectURL(blob);

        // Creamos un enlace <a> temporal en memoria
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${currentOrder._id.slice(-6).toUpperCase()}.pdf`; // Nombre del archivo

        // Hacemos clic en el enlace para iniciar la descarga
        document.body.appendChild(a);
        a.click();

        // Limpiamos eliminando el enlace y revocando la URL
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar la factura:', err);
        alert('No se pudo descargar la factura.');
      },
    });
  }

  public objectKeys(obj: object): string[] {
    if (!obj) {
      return []; // Añadimos una guarda para evitar errores si el objeto es nulo
    }
    return Object.keys(obj);
  }
}
