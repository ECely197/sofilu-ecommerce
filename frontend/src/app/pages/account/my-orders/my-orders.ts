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
  private router = inject(Router);
  
  public orders: any[] = [];
  public isLoadingOrders = true;

  ngOnInit(): void {
    console.log('MY-ORDERS COMPONENT: ngOnInit disparado. Esperando estado de autenticación...'); // Log #1
    
    this.authService.currentUser$.pipe(
      filter(user => user !== undefined),
      take(1)
    ).subscribe(user => {
      if (user) {
        console.log('MY-ORDERS COMPONENT: Usuario encontrado. UID:', user.uid); // Log #2
        this.isLoadingOrders = true;
        this.orderService.getOrdersForUser(user.uid).subscribe({
            next: (data) => {
              console.log('MY-ORDERS COMPONENT: Pedidos recibidos de la API:', data); // Log #3
              this.orders = data;
              this.isLoadingOrders = false;
            },
            error: (err) => {
              console.error('MY-ORDERS COMPONENT: ERROR en la llamada getOrdersForUser', err); // Log de Error Frontend
              this.isLoadingOrders = false;
            }
        });
      } else {
        console.log('MY-ORDERS COMPONENT: No se encontró usuario en la sesión.'); // Log #4
        this.isLoadingOrders = false;
      }
    });
  }

  viewOrderDetails(orderId: string): void {
    console.log('Navegar a la orden con ID:', orderId);
    // this.router.navigate(['/account/orders', orderId]);
  }
}