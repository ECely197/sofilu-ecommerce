import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, take } from 'rxjs';

// Tus servicios e interfaces
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
  // --- Inyección de Servicios ---
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

  constructor() {}

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
    // ¡Ahora esta llamada es correcta!
    this.customerService.getAddresses().subscribe({
      next: (data) => {
        this.addresses.set(data);
        const preferred = data.find((addr) => addr.isPreferred);
        this.selectedAddress.set(
          preferred || (data.length > 0 ? data[0] : null)
        );
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectAddress(address: any): void {
    this.selectedAddress.set(address);
  }

  async proceedToPayment(): Promise<void> {
    // 1. Validación inicial (sin cambios)
    if (!this.selectedAddress()) {
      alert('Por favor, selecciona una dirección de envío.');
      return;
    }

    console.log("--- CHECKOUT.TS [1/4]: Clic en 'Continuar al Pago'. ---");
    this.isLoading.set(true);

    try {
      // 2. Recopilación de los datos del pagador
      console.log(
        '--- CHECKOUT.TS: Recopilando información del pagador... ---'
      );

      const fullName: string = this.selectedAddress().fullName || '';
      const fullNameParts = fullName.split(' ').filter((part) => part); // Divide y elimina espacios extra
      const name = fullNameParts.shift() || ''; // El primer elemento es el nombre
      const surname = fullNameParts.join(' ') || name; // El resto es el apellido (o el nombre si no hay apellido)

      let currentUserEmail: string | null | undefined;
      // Usamos await aquí para asegurarnos de tener el email antes de continuar
      const user = await firstValueFrom(
        this.authService.currentUser$.pipe(take(1))
      );
      currentUserEmail = user?.email || null;

      // Verificación de que tenemos toda la información necesaria
      if (!currentUserEmail) {
        throw new Error(
          'No se pudo obtener el email del usuario para el pago.'
        );
      }

      const payerInfo = {
        name: name,
        surname: surname,
        email: currentUserEmail,
      };

      console.log(
        '--- CHECKOUT.TS: Información del pagador recopilada:',
        payerInfo
      );

      // 3. Llamada al servicio con todos los datos
      console.log(
        '--- CHECKOUT.TS [2/4]: Llamando a paymentService.createPreference con el total:',
        this.grandTotal()
      );

      const preference = await firstValueFrom(
        this.paymentService.createPreference(
          this.cartService.cartItems(),
          this.grandTotal(),
          payerInfo // Pasamos el objeto completo
        )
      );

      console.log(
        '--- CHECKOUT.TS [3/4]: Preferencia recibida del backend. ID:',
        preference?.id
      );

      // 4. Renderizado del Brick (sin cambios en esta parte)
      if (preference && preference.id) {
        this.currentStep.set('payment');
        setTimeout(() => {
          console.log(
            '--- CHECKOUT.TS [4/4]: Renderizando el Payment Brick. ---'
          );
          this.renderPaymentBrick(preference.id);
        }, 0);
      } else {
        throw new Error('No se recibió ID de preferencia del backend.');
      }
    } catch (error) {
      console.error(
        '--- CHECKOUT.TS: ERROR al crear la preferencia de pago:',
        error
      );
      alert('Error al conectar con la pasarela de pagos. Revisa la consola.');
      this.isLoading.set(false);
    }
  }

  async renderPaymentBrick(preferenceId: string) {
    const publicKey = environment.MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      console.error('Error: La Public Key de MP no está configurada.');
      this.isLoading.set(false);
      return;
    }
    const mp = new MercadoPago(publicKey, { locale: 'es-CO' });
    const bricksBuilder = mp.bricks();

    const container = document.getElementById('paymentBrick_container');
    if (container) container.innerHTML = '';

    // --- OBTENEMOS EL EMAIL DEL USUARIO LOGUEADO ---
    let currentUserEmail: string | undefined;
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      currentUserEmail = user?.email || undefined;
    });

    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    await bricksBuilder.create('payment', 'paymentBrick_container', {
      initialization: {
        amount: this.grandTotal(),
        preferenceId: preferenceId,
        payer: {
          email: currentUserEmail,
          // --- ¡AÑADIR ESTA LÍNEA! ---
          entityType: 'individual',
        },
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
        onReady: () => {
          this.isLoading.set(false);
          console.log('--- Payment Brick está listo. ---');
        },
        onSubmit: async () => {
          // Esta parte ya estaba bien, guardamos los datos antes del envío
          console.log(
            '--- onSubmit del Brick disparado. Guardando orden pendiente... aqui se queda ---'
          );
          const orderData = this.buildOrderData();
          if (orderData) {
            localStorage.setItem('pendingOrderData', JSON.stringify(orderData));
          }
          // No necesitamos retornar una promesa aquí a menos que hagamos una validación asíncrona
        },
        onError: (error: any) => {
          console.error('Error en el Payment Brick:', error);
          this.isLoading.set(false);
          this.currentStep.set('shipping');
        },
      },
    });
  }

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
