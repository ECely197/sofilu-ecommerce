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
      const status = params['status'];

      if (transactionId) {
        this.verifyAndCreateOrder(transactionId, status);
      } else {
        this.error.set('No se recibió información de la transacción');
        this.isLoading.set(false);
      }
    });
  }

  private async verifyAndCreateOrder(transactionId: string, status: string) {
    try {
      this.isLoading.set(true);

      // Verify transaction with Wompi
      const transactionStatus = await firstValueFrom(
        this.orderService.verifyWompiTransaction(transactionId)
      );

      this.paymentStatus.set(transactionStatus.status);

      if (transactionStatus.status === 'APPROVED') {
        // Get pending order data
        const pendingOrderData = localStorage.getItem('pendingOrderData');
        if (!pendingOrderData) {
          throw new Error('No se encontraron los datos del pedido');
        }

        const orderData = JSON.parse(pendingOrderData);

        // Create order in database
        const createdOrder = await firstValueFrom(
          this.orderService.createOrder({
            ...orderData,
            paymentId: transactionId,
            status: 'PAID',
            paymentMethod: 'WOMPI',
            paymentStatus: transactionStatus.status,
          })
        );

        // Update UI
        this.orderDetails.set(createdOrder);
        this.orderId.set(createdOrder._id);

        // Clear cart and pending data
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrderData');

        // Show success message
        this.toastService.show('¡Compra realizada con éxito!', 'success');
      } else {
        this.error.set(`Pago no aprobado. Estado: ${transactionStatus.status}`);
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
