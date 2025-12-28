import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast.service';
// Importa Ripple si lo tienes configurado globalmente o en el componente
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective], // Agrega RippleDirective si la usas
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

  // Reintentos
  private retryCount = 0;
  private maxRetries = 5;

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

  // --- FUNCIÓN QUE FALTABA PARA EL HTML ---
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  // ----------------------------------------

  private verifyOrder(orderId: string) {
    this.isLoading.set(true);
    this.paymentService.checkPaymentStatus(orderId).subscribe({
      next: (response) => {
        const status = response.status;
        this.paymentStatus.set(status);
        this.orderDetails.set(response.order);

        if (status === 'APPROVED') {
          this.cartService.clearCart();
          localStorage.removeItem('pendingOrderData');
          this.toastService.show('¡Pedido confirmado!', 'success');
          this.isLoading.set(false);
        } else if (status === 'PENDING') {
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.verifyOrder(orderId), 3000);
          } else {
            this.error.set(
              'Tu pago se está procesando. Te avisaremos por correo.'
            );
            this.isLoading.set(false);
          }
        } else {
          this.error.set('El pago no fue aprobado.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error(err);
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.verifyOrder(orderId), 3000);
        } else {
          this.error.set('Error verificando el pedido.');
          this.isLoading.set(false);
        }
      },
    });
  }
}
