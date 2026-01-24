import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

import { OrderService } from '../../../services/order';
import { AuthService } from '../../../services/auth';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';
import { UiState } from '../../../services/ui-state'; // 1. IMPORTAR UI STATE

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective, ReactiveFormsModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0 }),
      ),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('expanded <=> collapsed', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
  ],
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private uiState = inject(UiState); // 2. INYECTAR UI STATE

  // --- Signals de la Lista ---
  orders = signal<any[]>([]);
  isLoadingOrders = signal(true);
  expandedOrderId = signal<string | null>(null);

  // --- Signals del Modal ---
  isEditModalVisible = signal(false);
  editingOrder = signal<any | null>(null);
  editAddressForm!: FormGroup;

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.loadOrders(user.uid);
      }
    });

    this.editAddressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      streetAddress: ['', Validators.required],
      addressDetails: [''],
      department: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['000000'],
      orderNotes: [''],
      deliveryNotes: [''],
    });
  }

  loadOrders(uid: string) {
    this.orderService.getOrdersForUser(uid).subscribe({
      next: (data: any[]) => {
        this.orders.set(data);
        this.isLoadingOrders.set(false);
      },
      error: () => this.isLoadingOrders.set(false),
    });
  }

  // --- LÓGICA DE LA LISTA ---
  toggleOrderDetails(orderId: string) {
    this.expandedOrderId.update((current) =>
      current === orderId ? null : orderId,
    );
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // --- LÓGICA DEL MODAL DE EDICIÓN ---

  openEditModal(order: any) {
    if (order.status !== 'Procesando' && order.status !== 'Pendiente') {
      this.toastService.show(
        'Solo se pueden editar pedidos en proceso.',
        'error',
      );
      return;
    }

    this.editingOrder.set(order);
    this.editAddressForm.patchValue({
      fullName: order.customerInfo.name,
      email: order.customerInfo.email,
      phone: order.customerInfo.phone,
      streetAddress: order.shippingAddress.streetAddress,
      addressDetails: order.shippingAddress.addressDetails,
      department: order.shippingAddress.department,
      city: order.shippingAddress.city,
      postalCode: order.shippingAddress.postalCode,
      orderNotes: order.orderNotes,
      deliveryNotes: order.deliveryNotes,
    });

    this.isEditModalVisible.set(true);
    this.uiState.setModalState(true); // 3. OCULTAR HEADER
    document.body.style.overflow = 'hidden';
  }

  closeEditModal() {
    this.isEditModalVisible.set(false);
    this.editingOrder.set(null);
    this.uiState.setModalState(false); // 4. MOSTRAR HEADER
    document.body.style.overflow = '';
  }

  saveAddressChanges() {
    if (this.editAddressForm.invalid) return;

    const orderId = this.editingOrder()._id;

    const updatedData = {
      customerInfo: {
        name: this.editAddressForm.value.fullName,
        email: this.editAddressForm.value.email,
        phone: this.editAddressForm.value.phone,
      },
      shippingAddress: {
        ...this.editingOrder().shippingAddress,
        streetAddress: this.editAddressForm.value.streetAddress,
        addressDetails: this.editAddressForm.value.addressDetails,
        department: this.editAddressForm.value.department,
        city: this.editAddressForm.value.city,
        postalCode: this.editAddressForm.value.postalCode,
      },
      orderNotes: this.editAddressForm.value.orderNotes,
      deliveryNotes: this.editAddressForm.value.deliveryNotes,
    };

    this.orderService.updateOrderShipping(orderId, updatedData).subscribe({
      next: (updatedOrder: any) => {
        this.orders.update((orders) =>
          orders.map((o) => (o._id === orderId ? updatedOrder : o)),
        );
        this.toastService.show('Datos actualizados correctamente.', 'success');
        this.closeEditModal(); // Esto reactiva el header automáticamente
      },
      error: (err: any) => {
        this.toastService.show(
          err.error?.message || 'Error al actualizar.',
          'error',
        );
      },
    });
  }

  cancelOrder(orderId: string) {
    if (confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
      this.orderService.updateOrderStatus(orderId, 'Cancelado').subscribe({
        next: (updatedOrder: any) => {
          this.orders.update((orders) =>
            orders.map((o) => (o._id === orderId ? updatedOrder : o)),
          );
          this.toastService.show('Pedido cancelado.', 'success');
        },
        error: () => this.toastService.show('Error al cancelar.', 'error'),
      });
    }
  }

  // Lógica de cálculo de garantía
  getWarrantyInfo(
    orderDate: string,
    product: any,
  ): { isActive: boolean; deadline: Date; hasWarranty: boolean } {
    if (!product || !product.warrantyType) {
      return { isActive: false, deadline: new Date(), hasWarranty: false };
    }

    const purchaseDate = new Date(orderDate);
    const months = product.warrantyType.durationMonths;

    // Crear fecha de expiración
    const deadline = new Date(purchaseDate);
    deadline.setMonth(deadline.getMonth() + months);

    const now = new Date();
    const isActive = now <= deadline;

    return { isActive, deadline, hasWarranty: true };
  }

  requestWarranty(item: any, orderId: string) {
    // Aquí puedes abrir un modal de contacto o redirigir a WhatsApp con el mensaje predefinido
    const productName = item.product.name;
    const orderRef = orderId.slice(-6).toUpperCase();
    const msg = `Hola, quiero solicitar garantía para el producto "${productName}" del pedido #${orderRef}.`;

    // Redirigir a WhatsApp (ejemplo)
    window.open(
      `https://wa.me/573001234567?text=${encodeURIComponent(msg)}`,
      '_blank',
    );
  }
}
