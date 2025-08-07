import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Importamos Router y RouterLink
import { AuthService } from '../../../services/auth';
import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { take, filter } from 'rxjs/operators';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective], // Importamos lo necesario
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss'
})
export class MyOrdersComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router); // Inyectamos el Router
  
  public orders: any[] = [];
  public isLoadingOrders = true;

  ngOnInit(): void {
    // Esta es la lógica que carga los pedidos para el usuario actual
    this.authService.currentUser$.pipe(
      filter(user => user !== undefined),
      take(1)
    ).subscribe(user => {
      if (user) {
        this.orderService.getOrdersForUser(user.uid).subscribe(data => {
          this.orders = data;
          this.isLoadingOrders = false;
        });
      } else {
        this.isLoadingOrders = false;
      }
    });
  }

  // ¡AQUÍ ESTÁ EL MÉTODO QUE FALTABA!
  // Se ejecutará cuando el usuario haga clic en el botón "Ver Detalles"
  viewOrderDetails(orderId: string): void {
    // Por ahora, solo lo mostraremos en la consola.
    // En el futuro, crearemos la página de detalle del pedido para el cliente.
    console.log('Navegar a la orden con ID:', orderId);
    // this.router.navigate(['/account/orders', orderId]);
  }
}