import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order';
import { CartService } from '../../services/cart';
import { PaymentService } from '../../services/payment.service'; // <-- Importamos el servicio

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
  private paymentService = inject(PaymentService); // <-- Inyectamos el servicio

  orderId = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // 1. Leemos el ID de la transacción que Wompi nos envió en la URL
    this.route.queryParams.subscribe((params) => {
      const transactionId = params['id'];
      if (transactionId) {
        // 2. Si hay un ID, lo verificamos con nuestro backend
        this.verifyAndCreateOrder(transactionId);
      } else {
        this.error.set('No se encontró un ID de transacción para verificar.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Llama al backend para verificar el estado de la transacción en Wompi
   * y, si es APROBADO, crea el pedido en nuestra base de datos.
   */
  verifyAndCreateOrder(transactionId: string): void {
    this.paymentService.verifyTransaction(transactionId).subscribe({
      next: (response) => {
        if (response.status === 'APPROVED') {
          // 3. Si el pago fue aprobado, creamos el pedido desde localStorage
          this.createOrderFromLocalStorage();
        } else {
          this.error.set(
            `El estado del pago es: ${response.status}. Por favor, contacta a soporte.`
          );
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Hubo un error al verificar tu pago.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Lee los datos del pedido de localStorage, los envía a nuestra API para crear el pedido,
   * y luego limpia todo.
   */
  createOrderFromLocalStorage(): void {
    const pendingOrderDataString = localStorage.getItem('pendingOrderData');
    if (!pendingOrderDataString) {
      this.error.set('No se encontraron datos del pedido para confirmar.');
      this.isLoading.set(false);
      return;
    }

    const orderData = JSON.parse(pendingOrderDataString);

    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.orderId.set(savedOrder._id);
        this.isLoading.set(false);
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrderData');
      },
      error: (err) => {
        this.error.set('Hubo un error al guardar tu pedido.');
        this.isLoading.set(false);
      },
    });
  }
}
