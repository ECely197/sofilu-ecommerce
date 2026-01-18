import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  order = signal<any | null>(null);
  isLoading = signal<boolean>(true);

  statusForm!: FormGroup;
  orderStatuses = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];
  isEditingStatus = signal<boolean>(false);

  // --- COMPUTED SIGNALS PARA CÁLCULOS ---
  subtotal = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );
  });

  shippingCost = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder) return 0;
    // Calcula el costo de envío restando los otros componentes del total
    return (
      currentOrder.totalAmount -
      this.subtotal() +
      (currentOrder.discountAmount || 0)
    );
  });

  ngOnInit() {
    this.statusForm = new FormGroup({
      status: new FormControl('', Validators.required),
    });

    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.fetchOrder(orderId);
    } else {
      this.isLoading.set(false);
    }
  }

  fetchOrder(orderId: string): void {
    this.isLoading.set(true);
    this.orderService.getOrderById(orderId).subscribe({
      next: (data) => {
        this.order.set(data);
        this.statusForm.patchValue({ status: data.status });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el pedido:', err);
        this.isLoading.set(false);
      },
    });
  }

  updateStatus(): void {
    if (this.statusForm.invalid || !this.order()) return;
    const newStatus = this.statusForm.value.status;
    const currentOrder = this.order();

    if (newStatus && currentOrder) {
      this.orderService
        .updateOrderStatus(currentOrder._id, newStatus)
        .subscribe({
          next: (updatedOrder) => {
            this.order.set(updatedOrder);
            this.isEditingStatus.set(false); // Salir del modo edición
            this.toastService.show('¡Estado actualizado!', 'success');
          },
          error: (err) =>
            this.toastService.show('No se pudo actualizar el estado.', 'error'),
        });
    }
  }

  enableEditMode(): void {
    this.isEditingStatus.set(true);
  }
  cancelEditMode(): void {
    this.isEditingStatus.set(false);
  }

  getVariantOptionImage(item: any, variantName: string): string | undefined {
    const selectedOptionName = item.selectedVariants[variantName];
    if (!item.product?.variants || !selectedOptionName) return undefined;
    const variant = item.product.variants.find(
      (v: any) => v.name === variantName,
    );
    const option = variant?.options.find(
      (o: any) => o.name === selectedOptionName,
    );
    return option?.image;
  }

  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}
