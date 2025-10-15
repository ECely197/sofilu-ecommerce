import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../../services/order';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrls: ['./order-confirmation.scss'],
})
export class OrderConfirmation implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  orderId = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  orderDetails = signal<any>(null);
  paymentStatus = signal<'APPROVED' | 'DECLINED' | 'PENDING' | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const transactionId = params['id'];

      if (transactionId) {
        this.verifyAndCreateOrder(transactionId);
      } else {
        this.error.set('No se recibió información de la transacción');
        this.isLoading.set(false);
      }
    });
  }

  private async verifyAndCreateOrder(transactionId: string) {
    try {
      this.isLoading.set(true);

      // 1. Verificar el estado de la transacción
      const transactionStatus = await firstValueFrom(
        this.orderService.verifyWompiTransaction(transactionId)
      );

      this.paymentStatus.set(transactionStatus.status);

      if (transactionStatus.status === 'APPROVED') {
        // 2. Obtener datos del pedido guardados
        const pendingOrderData = localStorage.getItem('pendingOrderData');
        if (!pendingOrderData) {
          throw new Error('No se encontraron los datos del pedido');
        }

        const orderData = JSON.parse(pendingOrderData);

        // 3. Crear el pedido en la base de datos
        const createdOrder = await firstValueFrom(
          this.orderService.createOrder({
            ...orderData,
            paymentId: transactionId,
            paymentStatus: transactionStatus.status,
            paymentMethod: 'WOMPI',
            status: 'Procesando', // Agregamos el estado inicial del pedido
          })
        );

        // 4. Actualizar UI y limpiar datos temporales
        this.orderDetails.set(createdOrder);
        this.orderId.set(createdOrder._id);
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrderData');

        this.toastService.show('¡Compra realizada con éxito!', 'success');
      } else {
        this.error.set(
          `El pago no fue aprobado. Estado: ${transactionStatus.status}`
        );
      }
    } catch (error) {
      console.error('Error al procesar la orden:', error);
      this.error.set(
        'Error al procesar la orden. Por favor contacta a soporte.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
