// Contenido completo y corregido para: src/app/pages/checkout/checkout.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { Coupon } from '../../services/coupon';
import { SettingsService } from '../../services/settings.service';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface'; // ¡IMPORTACIÓN CLAVE!

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        query('.form-section', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate(
              '500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class checkout implements OnInit {
  public cartService = inject(CartService);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private couponService = inject(Coupon);
  private settingsService = inject(SettingsService);

  checkoutForm!: FormGroup;

  shippingCost = signal<number>(0);
  appliedCoupon = signal<any | null>(null);
  discountAmount = signal<number>(0);
  couponMessage = signal<string>('');
  couponError = signal<boolean>(false);

  grandTotal = computed(() => {
    const total =
      this.cartService.subTotal() + this.shippingCost() - this.discountAmount();
    return Math.max(0, total);
  });

  ngOnInit(): void {
    this.settingsService.getShippingCost().subscribe((cost) => {
      this.shippingCost.set(cost);
    });

    this.checkoutForm = new FormGroup({
      contactInfo: new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
      }),
      shippingAddress: new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
        postalCode: new FormControl(''),
        phone: new FormControl('', Validators.required),
      }),
    });
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
          err.error.message || 'Error al aplicar el cupón.'
        );
        this.couponError.set(true);
      },
    });
  }

  handlePayment(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }
    const formValue = this.checkoutForm.getRawValue();
    const customerInfo = {
      name: formValue.shippingAddress.name,
      email: formValue.contactInfo.email,
    };
    const cartItems = this.cartService.cartItems();
    const processedItems = cartItems.map((item) => {
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: this.finalItemPrice(item),
        selectedVariants: item.selectedVariants,
      };
    });
    const orderData = {
      customerInfo,
      items: processedItems,
      appliedCoupon: this.appliedCoupon() ? this.appliedCoupon().code : null,
      discountAmount: this.discountAmount(),
    };
    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation', savedOrder._id]);
      },
      error: (err) => {
        console.error('Error al crear el pedido:', err);
        alert(err.error.message || 'Hubo un error al procesar tu pedido.');
      },
    });
  }

  // --- MÉTODO CORREGIDO ---
  // Reemplazamos 'item: any' por 'item: CartItem'
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
