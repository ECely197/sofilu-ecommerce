import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service'; // Usamos PaymentService
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
  orderDetails = signal<any>(null); // Guardará la orden que viene de la BD
  paymentStatus = signal<'APPROVED' | 'DECLINED' | 'PENDING' | null>(null);

  ngOnInit(): void {
    // Obtenemos el ID de la URL (que Wompi nos envió como ?id=...)
    // OJO: Wompi a veces manda ?id= (Transaction ID) o usamos la referencia.
    // En nuestra integración, el 'reference' es el ID de la orden.
    // El widget redirige con ?id=REFERENCIA si configuramos redirectUrl con query params,
    // o Wompi añade ?id=TRANSACTION_ID por defecto.

    // En checkout.ts configuramos: queryParams: { status: 'success', id: wompiParams.reference }
    // Así que 'id' aquí es el ID DE LA ORDEN DE MONGO.

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
        // La respuesta del backend es: { status: 'APPROVED', order: {...} }
        this.paymentStatus.set(response.status);
        this.orderDetails.set(response.order);

        if (response.status === 'APPROVED') {
          // ¡Éxito! Limpiamos el carrito porque ya se pagó
          this.cartService.clearCart();
          localStorage.removeItem('pendingOrderData'); // Limpieza por si acaso
          this.toastService.show('¡Tu pedido ha sido confirmado!', 'success');
        } else if (response.status === 'PENDING') {
          // A veces Wompi tarda unos segundos.
          this.error.set(
            'Tu pago está siendo procesado. Te avisaremos por correo cuando se confirme.'
          );
        } else {
          this.error.set('El pago fue rechazado o anulado.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error verificando orden:', err);
        this.error.set(
          'No pudimos verificar el estado del pedido. Revisa tu correo o "Mis Pedidos".'
        );
        this.isLoading.set(false);
      },
    });
  }
}
