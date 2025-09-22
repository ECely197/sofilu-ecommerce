/**
 * @fileoverview Componente de la Página de Confirmación de Pedido.
 * Esta página es el destino final después de un pago exitoso.
 * Se encarga de leer los datos de la URL, crear el pedido en la base de datos
 * y limpiar el estado de la aplicación (carrito, localStorage).
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order';
import { CartService } from '../../services/cart';
import { RippleDirective } from '../../directives/ripple'; // Importa la directiva

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective], // Se añade RippleDirective
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss',
})
export class OrderConfirmation implements OnInit {
  // --- Inyección de Dependencias ---
  private route = inject(ActivatedRoute); // Para leer parámetros de la URL
  private orderService = inject(OrderService);
  private cartService = inject(CartService);

  // --- Estado del Componente con Signals ---
  orderId = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // 1. Escuchar los parámetros de la URL de retorno de la pasarela de pago (Mercado Pago).
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];

      // 2. Si el pago fue aprobado, proceder a crear el pedido.
      if (status === 'approved') {
        this.createOrderFromLocalStorage();
      } else {
        // Manejar casos de pago fallido, pendiente o cancelado.
        this.error.set(
          'El pago no pudo ser completado. Por favor, intenta de nuevo.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Recupera los datos del pedido que se guardaron en `localStorage` antes de
   * redirigir al usuario a la pasarela de pagos y los envía al backend.
   */
  createOrderFromLocalStorage(): void {
    const pendingOrderDataString = localStorage.getItem('pendingOrderData');
    if (!pendingOrderDataString) {
      this.error.set('No se encontraron datos del pedido para confirmar.');
      this.isLoading.set(false);
      return;
    }

    const orderData = JSON.parse(pendingOrderDataString);

    // 3. Llamar al servicio para guardar el pedido en la base de datos.
    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.orderId.set(savedOrder._id);
        this.isLoading.set(false);
        // 4. Limpiar el estado de la aplicación después de un pedido exitoso.
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrderData');
      },
      error: (err) => {
        this.error.set(
          'Hubo un error al guardar tu pedido en nuestro sistema.'
        );
        this.isLoading.set(false);
        console.error('Error al crear el pedido:', err);
      },
    });
  }
}
