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
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

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
  private toastService = inject(ToastService);
  public expandedOrderId = signal<string | null>(null);
  private confirmationService = inject(ConfirmationService);

  isEditModalVisible = signal(false);
  editingOrder = signal<any | null>(null);

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

  openEditModal(order: any): void {
    // Creamos una copia profunda del pedido para no modificar el original hasta guardar
    this.editingOrder.set(JSON.parse(JSON.stringify(order)));
    this.isEditModalVisible.set(true);
  }

  // ¡NUEVO MÉTODO para cerrar el modal!
  closeEditModal(): void {
    this.isEditModalVisible.set(false);
    this.editingOrder.set(null);
  }

  // ¡NUEVO MÉTODO para actualizar la cantidad en el modal!
  updateItemQuantityInModal(itemIndex: number, change: 1 | -1): void {
    this.editingOrder.update((order) => {
      if (!order) return null;
      const newQuantity = order.items[itemIndex].quantity + change;
      if (newQuantity > 0) {
        order.items[itemIndex].quantity = newQuantity;
      }
      return { ...order };
    });
  }

  // ¡NUEVO MÉTODO para eliminar un item en el modal!
  removeItemInModal(itemIndex: number): void {
    this.editingOrder.update((order) => {
      if (!order) return null;
      order.items.splice(itemIndex, 1);
      return { ...order };
    });
  }

  // ¡NUEVO MÉTODO para guardar los cambios!
  saveOrderChanges(): void {
    const orderToSave = this.editingOrder();
    if (!orderToSave) return;

    // Extraemos solo los datos de 'items' que necesita el backend
    const newItemsPayload = orderToSave.items.map((item: any) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      selectedVariants: item.selectedVariants,
    }));

    this.orderService.editOrder(orderToSave._id, newItemsPayload).subscribe({
      next: (updatedOrder) => {
        // Actualizamos la lista original y cerramos el modal
        this.orders = this.orders.map((o) =>
          o._id === updatedOrder._id ? updatedOrder : o
        );
        this.toastService.show('Pedido actualizado con éxito.', 'success');
        this.closeEditModal();
      },
      error: (err) => {
        this.toastService.show(
          err.error.message || 'No se pudo actualizar el pedido.',
          'error'
        );
      },
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Cancelar Pedido?',
      message:
        'Esta acción devolverá los productos al inventario y no se puede deshacer.',
      confirmText: 'Sí, cancelar',
    });

    if (confirmed) {
      this.orderService.updateOrderStatus(orderId, 'Cancelado').subscribe({
        next: (updatedOrder) => {
          this.orders = this.orders.map((o) =>
            o._id === orderId ? updatedOrder : o
          );
          this.toastService.show('Pedido cancelado con éxito.', 'success');
        },
        error: (err) => {
          this.toastService.show(
            err.error.message || 'No se pudo cancelar el pedido.',
            'error'
          );
        },
      });
    }
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
