import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, take } from 'rxjs';

import { CartService } from '../../services/cart';
import { PaymentService } from '../../services/payment.service';
import { Customer } from '../../services/customer';
import { AuthService } from '../../services/auth';
import { SettingsService } from '../../services/settings.service';
import { OrderService } from '../../services/order';
import { Coupon } from '../../services/coupon';
import { environment } from '../../../environments/environment';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface';

declare var MercadoPago: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class checkout implements OnInit {
  // --- Inyección de Dependencias ---
  public cartService = inject(CartService);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private customerService = inject(Customer);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private couponService = inject(Coupon);
  private orderService = inject(OrderService);

  // --- Signals para el Estado ---
  currentStep = signal<'shipping' | 'payment'>('shipping');
  addresses = signal<any[]>([]);
  selectedAddress = signal<any | null>(null);
  isLoading = signal(true);

  private preferenceId = signal<string | null>(null);
  shippingCost = signal(0);
  appliedCoupon = signal<any | null>(null);
  discountAmount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<boolean>(false);

  grandTotal = computed(() => {
    const total =
      this.cartService.subTotal() + this.shippingCost() - this.discountAmount();
    return Math.max(0, total);
  });

  constructor() {
    effect(() => {
      const prefId = this.preferenceId();
      if (prefId && this.currentStep() === 'payment') {
        setTimeout(() => this.renderPaymentBrick(prefId), 0);
      }
    });
  }

  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    this.settingsService
      .getShippingCost()
      .subscribe((cost) => this.shippingCost.set(cost));
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.isLoading.set(true);
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.customerService.getAddresses(user.uid).subscribe((data) => {
          this.addresses.set(data);
          const preferred = data.find((addr) => addr.isPreferred);
          this.selectedAddress.set(
            preferred || (data.length > 0 ? data[0] : null)
          );
          this.isLoading.set(false);
        });
      }
    });
  }

  selectAddress(address: any): void {
    this.selectedAddress.set(address);
  }

  async proceedToPayment(): Promise<void> {
    if (!this.selectedAddress()) {
      alert('Por favor, selecciona o añade una dirección de envío.');
      return;
    }
    this.isLoading.set(true);
    this.currentStep.set('payment');
    try {
      const preference = await firstValueFrom(
        this.paymentService.createPreference(
          this.cartService.cartItems(),
          this.grandTotal()
        )
      );
      if (preference && preference.id) {
        this.preferenceId.set(preference.id);
      } else {
        throw new Error('No se recibió ID de preferencia del backend.');
      }
    } catch (error) {
      console.error('Error al iniciar el proceso de pago:', error);
      this.currentStep.set('shipping');
      this.isLoading.set(false);
    }
  }

  async renderPaymentBrick(preferenceId: string) {
    const publicKey = environment.MERCADOPAGO_PUBLIC_KEY;
    const mp = new MercadoPago(publicKey, { locale: 'es-CO' });
    const bricksBuilder = mp.bricks();
    const container = document.getElementById('paymentBrick_container');
    if (container) container.innerHTML = '';

    await bricksBuilder.create('payment', 'paymentBrick_container', {
      initialization: {
        amount: this.grandTotal(),
        preferenceId: preferenceId,
      },
      customization: {
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          ticket: 'all',
          bankTransfer: 'all',
          maxInstallments: 1,
        },
      },
      callbacks: {
        onReady: () => this.isLoading.set(false),
        onSubmit: async () => {
          const orderData = this.buildOrderData();
          if (!orderData) {
            console.error('No se pudieron construir los datos del pedido.');
            alert('Ocurrió un error, por favor intenta de nuevo.');
            return;
          }
          localStorage.setItem('pendingOrderData', JSON.stringify(orderData));
        },
        onError: (error: any) => {
          console.error('Error en Payment Brick:', error);
        },
      },
    });
  }

  // --- MÉTODO buildOrderData COMPLETO ---
  private buildOrderData(): any | null {
    let currentUser: any = null;
    this.authService.currentUser$
      .pipe(take(1))
      .subscribe((user) => (currentUser = user));

    if (!this.selectedAddress() || !currentUser) {
      return null;
    }

    return {
      customerInfo: {
        name: this.selectedAddress().fullName,
        email: currentUser.email,
      },
      shippingAddress: this.selectedAddress(),
      items: this.cartService.cartItems().map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: this.finalItemPrice(item),
        selectedVariants: item.selectedVariants,
      })),
      appliedCoupon: this.appliedCoupon() ? this.appliedCoupon().code : null,
      discountAmount: this.discountAmount(),
      totalAmount: this.grandTotal(),
    };
  }

  // (Métodos applyCoupon, finalItemPrice, y objectKeys sin cambios)
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
          err.error.message || 'Error al aplicar el cupón.'
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
        if (option && option.priceModifier) {
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
