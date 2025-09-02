import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, take } from 'rxjs';

// Servicios e Interfaces
import { CartService } from '../../services/cart';
import { Customer, Address } from '../../services/customer'; // Solo importamos Address
import { AuthService } from '../../services/auth';
import { SettingsService } from '../../services/settings.service';
import { OrderService } from '../../services/order';
import { Coupon } from '../../services/coupon';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class checkout implements OnInit {
  // --- Inyección de Servicios ---
  public cartService = inject(CartService);
  private router = inject(Router);
  private customerService = inject(Customer);
  private authService = inject(AuthService); // Lo mantenemos por si lo necesitamos en el futuro
  private settingsService = inject(SettingsService);
  private couponService = inject(Coupon);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  // --- Signals para el Estado (Versión Simplificada) ---
  addresses = signal<Address[]>([]);
  selectedAddress = signal<Address | null>(null);
  isLoading = signal(true);
  isProcessingOrder = signal(false);

  // Signals para costos y cupones
  shippingCost = signal(0);
  appliedCoupon = signal<any | null>(null);
  discountAmount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<boolean>(false);

  grandTotal = computed(() => {
    const subtotal = this.cartService.subTotal();
    const shipping = this.shippingCost();
    const discount = this.discountAmount();
    return Math.max(0, subtotal + shipping - discount);
  });

  constructor() {}

  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.isLoading.set(true);
    // Ahora solo cargamos dos piezas de información en paralelo
    forkJoin({
      shippingCost: this.settingsService.getShippingCost(),
      addresses: this.customerService.getAddresses(),
    }).subscribe({
      next: ({ shippingCost, addresses }) => {
        this.shippingCost.set(shippingCost);

        this.addresses.set(addresses);
        const preferredAddress = addresses.find((a) => a.isPreferred);
        this.selectedAddress.set(
          preferredAddress || (addresses.length > 0 ? addresses[0] : null)
        );

        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.show(
          'Error al cargar los datos del checkout.',
          'error'
        );
        this.isLoading.set(false);
        console.error('Error en forkJoin de checkout:', err);
      },
    });
  }

  // --- MÉTODOS DE INTERACCIÓN ---

  selectAddress(address: Address): void {
    this.selectedAddress.set(address);
  }

  placeOrder(): void {
    if (!this.selectedAddress()) {
      this.toastService.show(
        'Por favor, selecciona una dirección de envío.',
        'error'
      );
      return;
    }

    this.isProcessingOrder.set(true);
    const orderData = this.buildOrderData();

    if (!orderData) {
      this.toastService.show(
        'No se pudo recopilar la información del pedido.',
        'error'
      );
      this.isProcessingOrder.set(false);
      return;
    }

    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.toastService.show('¡Pedido realizado con éxito!', 'success');
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation', savedOrder._id]);
      },
      error: (err) => {
        this.toastService.show('Hubo un error al crear tu pedido.', 'error');
        this.isProcessingOrder.set(false);
        console.error('Error al crear el pedido:', err);
      },
    });
  }

  // --- MÉTODOS HELPER ---

  private buildOrderData(): any | null {
    const selectedAddr = this.selectedAddress();
    if (!selectedAddr) {
      console.error('BuildOrderData falló: No hay dirección seleccionada.');
      return null;
    }

    const customerInfoPayload = {
      name: selectedAddr.fullName,
      email: selectedAddr.email,
      phone: selectedAddr.phone,
    };

    const { _id, ...shippingAddressPayload } = selectedAddr;

    return {
      customerInfo: customerInfoPayload,
      shippingAddress: shippingAddressPayload,
      items: this.cartService.cartItems().map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: this.finalItemPrice(item),
        selectedVariants: item.selectedVariants,
      })),
      appliedCoupon: this.appliedCoupon()?.code || null,
      discountAmount: this.discountAmount(),
      totalAmount: this.grandTotal(),
    };
  }

  applyCoupon(code: string): void {
    if (!code.trim()) return;
    this.couponService.validateCoupon(code).subscribe({
      next: (coupon) => {
        const subtotal = this.cartService.subTotal();
        const shipping = this.shippingCost();
        let discount = 0;
        let discountableBase = 0;

        if (coupon.appliesTo === 'Subtotal') {
          discountableBase = subtotal;
        } else if (coupon.appliesTo === 'Envío') {
          discountableBase = shipping;
        } else {
          discountableBase = subtotal + shipping;
        }

        if (coupon.discountType === 'Porcentaje') {
          discount = (discountableBase * coupon.value) / 100;
        } else {
          discount = coupon.value;
        }

        discount = Math.min(discount, discountableBase);
        this.discountAmount.set(discount);
        this.appliedCoupon.set(coupon);
        this.couponMessage.set(`¡Cupón "${coupon.code}" aplicado!`);
        this.couponError.set(false);
      },
      error: (err) => {
        this.discountAmount.set(0);
        this.appliedCoupon.set(null);
        this.couponMessage.set(
          err.error?.message || 'Error al aplicar el cupón.'
        );
        this.couponError.set(true);
      },
    });
  }

  public finalItemPrice(item: CartItem): number {
    let price = item.product.price;
    if (item.selectedVariants && item.product.variants) {
      for (const variantName in item.selectedVariants) {
        const selectedOptionName = item.selectedVariants[variantName];
        const variant = item.product.variants.find(
          (v) => v.name === variantName
        );
        const option = variant?.options.find(
          (o) => o.name === selectedOptionName
        );
        if (option?.priceModifier) {
          price += option.priceModifier;
        }
      }
    }
    return price;
  }

  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}
