// Contenido completo y final para: src/app/pages/order-confirmation/order-confirmation.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss',
})
export class OrderConfirmation implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);

  orderId = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // 1. Leemos los parámetros de la URL que nos envía Mercado Pago
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];

      // 2. Si el pago fue aprobado, procedemos a crear el pedido
      if (status === 'approved') {
        this.createOrderFromLocalStorage();
      } else {
        // Si el pago falló o está pendiente
        this.error.set(
          'El pago no pudo ser completado. Por favor, intenta de nuevo.'
        );
        this.isLoading.set(false);
      }
    });
  }

  createOrderFromLocalStorage(): void {
    const pendingOrderDataString = localStorage.getItem('pendingOrderData');
    if (!pendingOrderDataString) {
      this.error.set('No se encontraron datos del pedido para confirmar.');
      this.isLoading.set(false);
      return;
    }

    const orderData = JSON.parse(pendingOrderDataString);

    // 3. Llamamos a nuestra API para guardar el pedido en la base de datos
    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.orderId.set(savedOrder._id);
        this.isLoading.set(false);
        // 4. Limpiamos el carrito y los datos pendientes
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrderData');
      },
      error: (err) => {
        this.error.set('Hubo un error al guardar tu pedido.');
        this.isLoading.set(false);
        console.error('Error al crear el pedido:', err);
      },
    });
  }
}
