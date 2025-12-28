import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
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
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  orderId = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  orderDetails = signal<any>(null);
  paymentStatus = signal<'APPROVED' | 'DECLINED' | 'PENDING' | null>(null);

  // Variables para el control de reintentos
  private retryCount = 0;
  private maxRetries = 5; // Intentaremos 5 veces (aprox 15 segundos)

  ngOnInit(): void {
    const id = this.route.snapshot.queryParams['id'];

    if (id) {
      this.orderId.set(id);
      this.verifyOrder(id);
    } else {
      this.error.set('No se recibió el número de orden.');
      this.isLoading.set(false);
    }
  }

  private verifyOrder(orderId: string) {
    this.isLoading.set(true);

    this.paymentService.checkPaymentStatus(orderId).subscribe({
      next: (response) => {
        const status = response.status;
        this.paymentStatus.set(status);
        this.orderDetails.set(response.order);

        if (status === 'APPROVED') {
          // --- ÉXITO ---
          this.cartService.clearCart();
          localStorage.removeItem('pendingOrderData');
          this.toastService.show('¡Tu pedido ha sido confirmado!', 'success');
          this.isLoading.set(false);
        } else if (status === 'PENDING') {
          // --- AÚN PENDIENTE: REINTENTAR ---
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(
              `Pago pendiente... Reintentando (${this.retryCount}/${this.maxRetries})`
            );

            // Esperar 3 segundos y volver a llamar
            setTimeout(() => {
              this.verifyOrder(orderId);
            }, 3000);
          } else {
            // Se acabaron los intentos
            this.error.set(
              'Tu pago está siendo procesado. Te enviaremos un correo apenas se confirme.'
            );
            this.isLoading.set(false);
          }
        } else {
          // --- RECHAZADO O ERROR ---
          this.error.set(
            'El pago fue rechazado o anulado. Intenta nuevamente.'
          );
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error verificando orden:', err);
        // Si hay error de red, también vale la pena reintentar un par de veces
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.verifyOrder(orderId), 3000);
        } else {
          this.error.set('No pudimos verificar el estado. Revisa tu correo.');
          this.isLoading.set(false);
        }
      },
    });
  }
}
