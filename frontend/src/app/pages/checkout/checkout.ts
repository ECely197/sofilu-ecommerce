import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../services/cart';
import { Customer, Address } from '../../services/customer';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { Coupon } from '../../services/coupon';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import { PaymentService } from '../../services/payment.service';
import { CartItem } from '../../interfaces/cart-item.interface';
import {
  DeliveryOption,
  DeliveryOptionService,
} from '../../services/delivery-option.service.ts';
import { AddressFormModalComponent } from '../../components/address-form-modal/address-form-modal';

declare const WidgetCheckout: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RippleDirective,
    ReactiveFormsModule,
    AddressFormModalComponent,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
})
export class checkout implements OnInit {
  // --- Inyecciones ---
  public cartService = inject(CartService);
  private router = inject(Router);
  private customerService = inject(Customer);
  private settingsService = inject(SettingsService);
  private couponService = inject(Coupon);
  private toastService = inject(ToastService);
  private paymentService = inject(PaymentService);
  private fb = inject(FormBuilder);
  private deliveryOptionService = inject(DeliveryOptionService);

  @ViewChild(AddressFormModalComponent)
  addressModal!: AddressFormModalComponent;

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

  // Opciones de Entrega
  deliveryType = signal<'Normal' | 'Personalizada'>('Normal');
  deliveryOptions = signal<DeliveryOption[]>([]);
  selectedDeliveryOption = signal<DeliveryOption | null>(null);

  notesForm = this.fb.group({ orderNotes: [''], deliveryNotes: [''] });

  private appSettings: AppSettings | null = null;

  // --- COMPUTED SIGNALS (LÓGICA MEJORADA) ---

  // Calcula el costo de envío final basándose en la selección
  finalShippingCost = computed(() => {
    if (this.deliveryType() === 'Personalizada') {
      return this.selectedDeliveryOption()?.cost ?? 0;
    }
    return this.shippingCost(); // Costo estándar
  });

  grandTotal = computed(() => {
    const subtotal = this.cartService.subTotal();
    const shipping = this.finalShippingCost(); // Usa el nuevo computed
    const discount = this.discountAmount();
    return Math.max(0, subtotal + shipping - discount);
  });

  // --- Ciclo de Vida ---
  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    this.isLoading.set(true);

    this.customerService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const preferred = addresses.find((a) => a.isPreferred) || addresses[0];
        if (preferred) this.selectAddress(preferred);
      },
    });

    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.appSettings = settings;
        if (this.selectedAddress()) this.selectAddress(this.selectedAddress()!);
        this.isLoading.set(false);
      },
    });

    // Cargar opciones de entrega especial
    this.deliveryOptionService.getActiveOptions().subscribe((options) => {
      this.deliveryOptions.set(options);
    });
  }

  // --- MÉTODOS DE INTERACCIÓN ---

  selectAddress(address: Address): void {
    this.selectedAddress.set(address);
    if (this.appSettings) {
      const isBogota = address.city.toLowerCase().includes('bogota');
      this.shippingCost.set(
        isBogota
          ? this.appSettings.shippingCostBogota
          : this.appSettings.shippingCostNational,
      );
    }
  }

  applyCoupon(code: string): void {
    if (!code.trim()) return;
    this.couponService.validateCoupon(code).subscribe({
      next: (coupon) => {
        const subtotal = this.cartService.subTotal();
        let discount = 0;
        if (coupon.discountType === 'Porcentaje') {
          discount = (subtotal * coupon.value) / 100;
        } else {
          discount = coupon.value;
        }
        this.discountAmount.set(discount);
        this.appliedCoupon.set(coupon);
        this.couponMessage.set(`¡Cupón "${coupon.code}" aplicado!`);
        this.couponError.set(false);
      },
      error: (err) => {
        this.discountAmount.set(0);
        this.appliedCoupon.set(null);
        this.couponMessage.set(err.error?.message || 'Error al aplicar cupón.');
        this.couponError.set(true);
      },
    });
  }

  selectDeliveryType(type: 'Normal' | 'Personalizada') {
    this.deliveryType.set(type);
    if (type === 'Normal') {
      this.selectedDeliveryOption.set(null); // Limpiar selección si vuelven a normal
    }
  }

  selectDeliveryOption(option: DeliveryOption) {
    // Si tocan la misma, se deselecciona. Si es otra, se selecciona.
    this.selectedDeliveryOption.update((current) =>
      current?._id === option._id ? null : option,
    );
  }

  openAddressModal() {
    this.addressModal.open();
  }
  handleAddressCreated(newAddress: Address) {
    this.addresses.update((current) => [...current, newAddress]);
    this.selectAddress(newAddress);
  }

  // --- LÓGICA DE PAGO ---

  processPayment() {
    if (this.isProcessingOrder()) return;
    this.isProcessingOrder.set(true);

    const orderData = this.buildOrderData();
    if (!orderData) {
      this.isProcessingOrder.set(false);
      return;
    }

    this.paymentService.initWompiTransaction(orderData).subscribe({
      next: (response) => {
        if (!response.success || !response.wompiData) {
          this.toastService.show('Error al iniciar el pago.', 'error');
          this.isProcessingOrder.set(false);
          return;
        }
        this.openWompiWidget(response.wompiData, orderData.customerInfo);
      },
      error: (err) => {
        console.error('Error iniciando pago:', err);
        this.toastService.show('Error de conexión con el servidor.', 'error');
        this.isProcessingOrder.set(false);
      },
    });
  }

  private openWompiWidget(wompiParams: any, customerInfo: any): void {
    const checkout = new WidgetCheckout({
      currency: wompiParams.currency,
      amountInCents: wompiParams.amountInCents,
      reference: wompiParams.reference,
      publicKey: wompiParams.publicKey,
      signature: { integrity: wompiParams.signature },
      //redirectUrl: wompiParams.redirectUrl,
      customerData: {
        email: customerInfo.email,
        fullName: customerInfo.name,
        phoneNumber: customerInfo.phone,
        phoneNumberPrefix: '+57',
      },
    });

    checkout.open((result: any) => {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        this.toastService.show('¡Pago aprobado! Redirigiendo...', 'success');
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation'], {
          queryParams: { id: wompiParams.reference },
        });
      } else {
        this.toastService.show('El pago fue rechazado o falló.', 'error');
      }
      this.isProcessingOrder.set(false);
    });
  }

  // --- MÉTODOS AUXILIARES (HELPERS) ---

  private buildOrderData(): any | null {
    const selectedAddr = this.selectedAddress();
    if (!selectedAddr) {
      this.toastService.show(
        'Por favor, selecciona o añade una dirección.',
        'error',
      );
      return null;
    }

    return {
      customerInfo: {
        name: selectedAddr.fullName,
        email: selectedAddr.email,
        phone: selectedAddr.phone,
      },
      shippingAddress: selectedAddr,
      items: this.cartService.cartItems().map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: this.finalItemPrice(item),
        selectedVariants: item.selectedVariants,
      })),
      appliedCoupon: this.appliedCoupon()?.code || null,
      discountAmount: this.discountAmount(),
      totalAmount: this.grandTotal(),
      deliveryType: this.deliveryType(),
      orderNotes: this.notesForm.value.orderNotes || '',
      deliveryNotes: this.notesForm.value.deliveryNotes || '',
      selectedDeliveryOption: this.selectedDeliveryOption()?._id || null,
    };
  }

  public finalItemPrice(item: CartItem): number {
    let price = item.product.price;
    if (item.selectedVariants && item.product.variants) {
      for (const variantName in item.selectedVariants) {
        const option = item.product.variants
          .find((v) => v.name === variantName)
          ?.options.find((o) => o.name === item.selectedVariants[variantName]);
        if (option?.price) price += option.price;
      }
    }
    return price;
  }

  public objectKeys(obj: object): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
