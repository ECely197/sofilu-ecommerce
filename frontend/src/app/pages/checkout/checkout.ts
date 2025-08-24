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
import { firstValueFrom } from 'rxjs';

import { CartService } from '../../services/cart';
import { PaymentService } from '../../services/payment.service';
import { Coupon } from '../../services/coupon';
import { SettingsService } from '../../services/settings.service';
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
  public cartService = inject(CartService);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private couponService = inject(Coupon);
  private settingsService = inject(SettingsService);

  shippingCost = signal(0);
  appliedCoupon = signal<any | null>(null);
  discountAmount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<boolean>(false);

  // Usaremos un solo signal de carga para simplificar
  isLoading = signal(true);
  private preferenceId = signal<string | null>(null);

  grandTotal = computed(() => {
    const total =
      this.cartService.subTotal() + this.shippingCost() - this.discountAmount();
    return Math.max(0, total);
  });

  constructor() {
    effect(() => {
      const prefId = this.preferenceId();
      if (prefId) {
        setTimeout(() => this.renderPaymentBrick(prefId), 0);
      }
    });
  }

  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.settingsService.getShippingCost().subscribe({
      next: (cost) => {
        this.shippingCost.set(cost);
        this.startPaymentProcess();
      },
      error: (err) => {
        console.error('Error al obtener costo de envío:', err);
        alert('No se pudo obtener la información de envío.');
        this.isLoading.set(false);
      },
    });
  }

  // Ya no necesitamos ngAfterViewInit

  async startPaymentProcess() {
    this.isLoading.set(true);
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
        throw new Error('No se recibió un ID de preferencia del backend.');
      }
    } catch (error) {
      console.error('Error al iniciar el proceso de pago:', error);
      alert('No se pudo iniciar la pasarela de pagos.');
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

    await bricksBuilder.create('payment', 'paymentBrick_container', {
      initialization: {
        amount: this.grandTotal(),
        preferenceId: preferenceId,
      },
      customization: {
        // --- ¡CAMBIO CRÍTICO AQUÍ! ---
        // Añadimos esta sección para decirle a Mercado Pago qué métodos de pago habilitar.
        paymentMethods: {
          creditCard: 'all', // Habilita todas las tarjetas de crédito
          debitCard: 'all', // Habilita todas las tarjetas de débito
          ticket: 'all', // Habilita pagos en efectivo (Efecty, etc.)
          bankTransfer: 'all', // Habilita PSE
          maxInstallments: 1,
        },
        visual: {
          style: {
            theme: 'default',
          },
        },
      },
      callbacks: {
        onReady: () => {
          this.isLoading.set(false);
        },
        onSubmit: async ({
          selectedPaymentMethod,
          formData,
        }: {
          selectedPaymentMethod: any;
          formData: any;
        }) => {
          // El SDK de Mercado Pago maneja el procesamiento y la redirección.
          // No es necesario añadir lógica aquí.
        },
        onError: (error: any) => {
          this.isLoading.set(false);
          console.error('Error en el Payment Brick:', error);
          alert(
            'Ocurrió un error al procesar tu pago. Por favor, revisa los datos e intenta de nuevo.'
          );
        },
      },
    });
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
