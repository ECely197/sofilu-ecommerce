import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Importamos Router y RouterLink
import { AuthService } from '../../../services/auth';
import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { take, filter } from 'rxjs/operators';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective], // Importamos lo necesario
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0, margin: '0' })
      ),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition(
        'expanded <=> collapsed',
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class MyOrdersComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public orders: any[] = [];
  public isLoadingOrders = true;

  public expandedOrderId = signal<string | null>(null);

  ngOnInit(): void {
    console.log(
      'MY-ORDERS COMPONENT: ngOnInit disparado. Esperando estado de autenticación...'
    ); // Log #1

    this.authService.currentUser$
      .pipe(
        filter((user) => user !== undefined),
        take(1)
      )
      .subscribe((user) => {
        if (user) {
          console.log(
            'MY-ORDERS COMPONENT: Usuario encontrado. UID:',
            user.uid
          ); // Log #2
          this.isLoadingOrders = true;
          this.orderService.getOrdersForUser(user.uid).subscribe({
            next: (data) => {
              console.log(
                'MY-ORDERS COMPONENT: Pedidos recibidos de la API:',
                data
              ); // Log #3
              this.orders = data;
              this.isLoadingOrders = false;
              this.cdr.detectChanges(); // <-- Aquí actualiza la vista después de recibir los datos
            },
            error: (err) => {
              console.error(
                'MY-ORDERS COMPONENT: ERROR en la llamada getOrdersForUser',
                err
              ); // Log de Error Frontend
              this.isLoadingOrders = false;
              this.cdr.detectChanges(); // <-- Aquí actualiza la vista después de un error
            },
          });
        } else {
          console.log(
            'MY-ORDERS COMPONENT: No se encontró usuario en la sesión.'
          ); // Log #4
          this.isLoadingOrders = false;
        }
      });
  }

  toggleOrderDetails(orderId: string): void {
    // Si el pedido clickeado ya está abierto, lo cerramos.
    // Si no, abrimos el nuevo.
    this.expandedOrderId.update((currentId) =>
      currentId === orderId ? null : orderId
    );
  }

  // Helper para la plantilla (para que sea más legible)
  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  viewOrderDetails(orderId: string): void {
    console.log('Navegar a la orden con ID:', orderId);
    // this.router.navigate(['/account/orders', orderId]);
  }
}
