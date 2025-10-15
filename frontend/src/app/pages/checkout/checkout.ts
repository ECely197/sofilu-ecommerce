import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Servicios e Interfaces
import { CartService } from '../../services/cart';
import { Customer, Address } from '../../services/customer';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { OrderService } from '../../services/order';
import { Coupon } from '../../services/coupon';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface';
import { environment } from '../../../environments/environment.prod';
import { PaymentService } from '../../services/payment.service';
import { loadScript } from '../../utils/script-loader';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

declare const WompiCheckout: any;

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
  private settingsService = inject(SettingsService);
  private couponService = inject(Coupon);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private paymentService = inject(PaymentService);
  // --- Signals ---
  addresses = signal<Address[]>([]);
  selectedAddress = signal<Address | null>(null);
  isLoading = signal(true);
  isProcessingOrder = signal(false);
  shippingCost = signal(0);
  appliedCoupon = signal<any | null>(null);
  discountAmount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<boolean>(false);
  serviceFee = signal(0);

  grandTotal = computed(() => {
    const subtotal = this.cartService.subTotal();
    const shipping = this.shippingCost();
    const discount = this.discountAmount();
    const fee = this.serviceFee();
    return Math.max(0, subtotal + shipping - discount + fee);
  });

  private appSettings: AppSettings | null = null;

  constructor() {}

  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    this.isLoading.set(true);

    // --- ¡CAMBIO! Hacemos las llamadas por separado ---

    // 1. Cargar Direcciones (la más importante)
    this.customerService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const preferredAddress = addresses.find((a) => a.isPreferred);
        const defaultAddress =
          preferredAddress || (addresses.length > 0 ? addresses[0] : null);
        if (defaultAddress) {
          this.selectAddress(defaultAddress); // Esto llamará a la lógica de envío
        }
      },
      error: (err) => {
        this.toastService.show('Error al cargar tus direcciones.', 'error');
        console.error('Error cargando direcciones:', err);
      },
    });

    // 2. Cargar Ajustes (ahora es independiente)
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.appSettings = settings;
        // Volvemos a calcular el envío por si las direcciones cargaron antes
        if (this.selectedAddress()) {
          this.selectAddress(this.selectedAddress()!);
        }
        // Calculamos la tarifa de servicio
        if (settings.serviceFeePercentage > 0) {
          const fee =
            this.cartService.subTotal() * (settings.serviceFeePercentage / 100);
          this.serviceFee.set(fee);
        }
        this.isLoading.set(false); // Ponemos el loading en false aquí
      },
      error: (err) => {
        console.error('Error cargando los ajustes de la tienda:', err);
        this.toastService.show(
          'No se pudieron cargar los ajustes de la tienda.',
          'error'
        );
        this.isLoading.set(false); // También aquí
      },
    });
  }

  // --- MÉTODOS DE INTERACCIÓN ---

  selectAddress(address: Address): void {
    this.selectedAddress.set(address);

    if (this.appSettings) {
      const isBogota = address.city.toLowerCase().includes('bogota');
      const newShippingCost = isBogota
        ? this.appSettings.shippingCostBogota
        : this.appSettings.shippingCostNational;
      this.shippingCost.set(newShippingCost);
    }
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
        if (option?.price) {
          price += option.price;
        }
      }
    }
    return price;
  }

  public objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
  /**
   * Inicia el proceso de pago with Wompi.
   */
  async processPayment() {
    try {
      this.isProcessingOrder.set(true);
      const selectedAddr = this.selectedAddress();

      if (!selectedAddr) {
        throw new Error('Por favor selecciona una dirección de envío');
      }

      const reference = `ORDER_${Date.now()}`;

      const response = await firstValueFrom(
        this.paymentService.createTransaction({
          amount_in_cents: this.grandTotal() * 100,
          customer_email: selectedAddr.email,
          customer_name: selectedAddr.fullName,
          customer_phone: selectedAddr.phone,
          reference,
        })
      );

      if (!response?.redirectUrl) {
        throw new Error('No se recibió URL de redirección válida');
      }

      // Guardar datos antes de redirigir
      localStorage.setItem(
        'pendingOrderData',
        JSON.stringify({
          reference,
          transactionId: response.transactionId,
          total: this.grandTotal(),
          shippingAddress: selectedAddr,
          items: this.cartService.cartItems(),
          createdAt: new Date().toISOString(),
        })
      );

      // Usar la URL del checkout de Wompi
      window.location.href = response.redirectUrl;
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      this.toastService.show(
        'Error al procesar el pago. Por favor intenta nuevamente.',
        'error'
      );
    } finally {
      this.isProcessingOrder.set(false);
    }
  }
}
