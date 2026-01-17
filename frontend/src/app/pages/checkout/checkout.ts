import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ViewChild } from '@angular/core';

// Servicios
import { CartService } from '../../services/cart';
import { Customer, Address } from '../../services/customer';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { Coupon } from '../../services/coupon';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface';
import { PaymentService } from '../../services/payment.service';
import { AddressFormModalComponent } from '../../components/address-form-modal/address-form-modal';

// Declaramos la variable global que inyecta el script de Wompi
declare const WidgetCheckout: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RippleDirective,
    AddressFormModalComponent,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class checkout implements OnInit {
  public cartService = inject(CartService);
  private router = inject(Router);
  private customerService = inject(Customer);
  private settingsService = inject(SettingsService);
  private couponService = inject(Coupon);
  private toastService = inject(ToastService);
  private paymentService = inject(PaymentService);

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

  private appSettings: AppSettings | null = null;

  @ViewChild(AddressFormModalComponent)
  addressModal!: AddressFormModalComponent;

  grandTotal = computed(() => {
    const subtotal = this.cartService.subTotal();
    const shipping = this.shippingCost();
    const discount = this.discountAmount();
    const fee = this.serviceFee();
    return Math.max(0, subtotal + shipping - discount + fee);
  });

  openAddressModal() {
    this.addressModal.open();
  }

  handleAddressCreated(newAddress: Address) {
    // 1. Añadir la nueva dirección a la lista
    this.addresses.update((current) => [...current, newAddress]);
    // 2. Seleccionarla automáticamente
    this.selectAddress(newAddress);
  }

  ngOnInit(): void {
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Cargar direcciones
    this.customerService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const preferred = addresses.find((a) => a.isPreferred) || addresses[0];
        if (preferred) this.selectAddress(preferred);
      },
      error: () => {
        this.toastService.show('Error al cargar direcciones.', 'error');
        this.isLoading.set(false);
      },
    });

    // Cargar ajustes
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.appSettings = settings;
        if (this.selectedAddress()) this.selectAddress(this.selectedAddress()!);
        if (settings.serviceFeePercentage > 0) {
          this.serviceFee.set(
            this.cartService.subTotal() * (settings.serviceFeePercentage / 100)
          );
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectAddress(address: Address): void {
    this.selectedAddress.set(address);
    if (this.appSettings) {
      const isBogota = address.city.toLowerCase().includes('bogota');
      this.shippingCost.set(
        isBogota
          ? this.appSettings.shippingCostBogota
          : this.appSettings.shippingCostNational
      );
    }
  }

  applyCoupon(code: string): void {
    if (!code.trim()) return;
    this.couponService.validateCoupon(code).subscribe({
      next: (coupon) => {
        let base = this.cartService.subTotal();
        if (coupon.appliesTo === 'Envío') base = this.shippingCost();
        if (coupon.appliesTo === 'Todo') base += this.shippingCost();

        let discount =
          coupon.discountType === 'Porcentaje'
            ? (base * coupon.value) / 100
            : coupon.value;
        this.discountAmount.set(Math.min(discount, base));
        this.appliedCoupon.set(coupon);
        this.couponMessage.set('Cupón aplicado con éxito');
        this.couponError.set(false);
      },
      error: (err) => {
        this.discountAmount.set(0);
        this.appliedCoupon.set(null);
        this.couponMessage.set(err.error?.message || 'Cupón inválido');
        this.couponError.set(true);
      },
    });
  }

  // --- MÉTODOS AUXILIARES (Restaurados) ---

  // Necesario para iterar sobre las variantes en el HTML
  objectKeys(obj: object): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Necesario para calcular el precio final con variantes en el HTML
  finalItemPrice(item: CartItem): number {
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

  private buildOrderData(): any | null {
    const addr = this.selectedAddress();
    if (!addr) return null;

    return {
      customerInfo: {
        name: addr.fullName,
        email: addr.email,
        phone: addr.phone,
      },
      shippingAddress: addr,
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

  // --- LÓGICA DE PAGO CON WOMPI WIDGET ---
  processPayment() {
    if (this.isProcessingOrder()) return;
    this.isProcessingOrder.set(true);

    const orderData = this.buildOrderData();
    if (!orderData) {
      this.toastService.show('Selecciona una dirección de envío.', 'error');
      this.isProcessingOrder.set(false);
      return;
    }

    // 1. Pedir al Backend que registre la orden y nos de la firma
    this.paymentService.initWompiTransaction(orderData).subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastService.show('Error al iniciar el pago.', 'error');
          this.isProcessingOrder.set(false);
          return;
        }

        const wompiParams = response.wompiData;

        // 2. Configurar el Widget con los datos SEGUROS
        const checkout = new WidgetCheckout({
          currency: wompiParams.currency,
          amountInCents: wompiParams.amountInCents,
          reference: wompiParams.reference,
          publicKey: wompiParams.publicKey,
          signature: { integrity: wompiParams.signature },
          redirectUrl: wompiParams.redirectUrl,
          customerData: {
            email: orderData.customerInfo.email,
            fullName: orderData.customerInfo.name,
            phoneNumber: orderData.customerInfo.phone,
            phoneNumberPrefix: '+57',
            legalId: '123456789',
            legalIdType: 'CC',
          },
        });

        // 3. Abrir el Widget
        checkout.open((result: any) => {
          const transaction = result.transaction;
          console.log('Wompi result:', transaction);

          if (transaction.status === 'APPROVED') {
            this.toastService.show(
              '¡Pago aprobado! Redirigiendo...',
              'success'
            );
            this.cartService.clearCart();
            setTimeout(() => {
              this.router.navigate(['/order-confirmation'], {
                queryParams: { status: 'success', id: wompiParams.reference },
              });
            }, 1500);
          } else if (
            transaction.status === 'DECLINED' ||
            transaction.status === 'ERROR'
          ) {
            this.toastService.show(
              'El pago fue rechazado. Intenta nuevamente.',
              'error'
            );
          }
          this.isProcessingOrder.set(false);
        });
      },
      error: (err) => {
        console.error('Error iniciando pago:', err);
        this.toastService.show('Error de conexión con el servidor.', 'error');
        this.isProcessingOrder.set(false);
      },
    });
  }
}
