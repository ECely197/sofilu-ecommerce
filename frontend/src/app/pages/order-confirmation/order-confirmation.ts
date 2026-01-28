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
        // VALIDACIÓN DE SEGURIDAD (Evita el error de consola)
        if (!response || !response.status) {
          console.warn('Respuesta inválida del servidor, reintentando...');
          this.handleRetry(orderId);
          return;
        }

        const status = response.status;

        // Si la orden ya trae datos, los mostramos aunque el pago siga pendiente
        if (response.order) {
          this.orderDetails.set(response.order);
        }

        this.paymentStatus.set(status);

        if (status === 'APPROVED') {
          this.cartService.clearCart();
          localStorage.removeItem('pendingOrderData'); // Limpieza
          this.toastService.show('¡Pedido confirmado!', 'success');
          this.isLoading.set(false); // ¡ÉXITO RÁPIDO!
        } else if (status === 'PENDING') {
          // Si está pendiente, seguimos intentando pero mostramos algo al usuario si tenemos datos
          if (this.retryCount < this.maxRetries) {
            this.handleRetry(orderId);
          } else {
            // Se acabó el tiempo, mostramos estado pendiente final
            this.error.set(
              'Tu pago se está procesando. Te avisaremos por correo.',
            );
            this.isLoading.set(false);
          }
        } else {
          // DECLINED, ERROR, VOIDED
          this.error.set('El pago no fue aprobado o fue rechazado.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error de red al verificar:', err);
        this.handleRetry(orderId);
      },
    });
  }
  private handleRetry(orderId: string) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      // Aumentamos el tiempo entre intentos para darle aire al servidor
      const delay = this.retryCount * 1000;
      setTimeout(() => this.verifyOrder(orderId), delay);
    } else {
      this.error.set('No pudimos verificar el estado final. Revisa tu correo.');
      this.isLoading.set(false);
    }
  }
}
