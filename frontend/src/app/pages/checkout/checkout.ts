import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, take } from 'rxjs';

// Servicios e Interfaces
import { CartService } from '../../services/cart';
import { Customer, Address } from '../../services/customer';
import { AuthService } from '../../services/auth';
import { SettingsService } from '../../services/settings.service';
import { OrderService } from '../../services/order';
import { Coupon } from '../../services/coupon';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';
import { CartItem } from '../../interfaces/cart-item.interface';
import { PaymentService } from '../../services/payment.service';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { environment } from '../../../environments/environment';
import { AppSettings } from '../../services/settings.service';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

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
  private paymentService = inject(PaymentService);

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
    // 1. Guarda de seguridad: si el carrito está vacío, no tiene sentido estar aquí.
    // Redirigimos al usuario de vuelta a la página del carrito.
    if (this.cartService.totalItems() === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // 2. Activamos el estado de carga para mostrar el esqueleto (skeleton) en la UI.
    this.isLoading.set(true);

    // 3. Usamos `forkJoin` de RxJS para realizar dos llamadas a la API en paralelo.
    // Esto es más eficiente que hacer una llamada después de la otra.
    forkJoin({
      settings: this.settingsService.getSettings(),
      addresses: this.customerService.getAddresses(),
    }).subscribe({
      // `next` se ejecuta solo si AMBAS llamadas a la API son exitosas.
      next: ({ settings, addresses }) => {
        // Guardamos los ajustes globales en una propiedad de la clase para usarlos después.
        this.appSettings = settings;

        // Actualizamos el signal con la lista de direcciones del usuario.
        this.addresses.set(addresses);

        // Buscamos si el usuario tiene una dirección marcada como "Preferida".
        const preferredAddress = addresses.find((a) => a.isPreferred);

        // Determinamos la dirección por defecto: la preferida, o la primera de la lista si no hay preferida.
        const defaultAddress =
          preferredAddress || (addresses.length > 0 ? addresses[0] : null);

        // Si se encontró una dirección por defecto, la seleccionamos.
        if (defaultAddress) {
          // Llamamos a `selectAddress` que ya contiene la lógica para calcular el costo de envío.
          this.selectAddress(defaultAddress);
        }

        // Calculamos la tarifa de servicio basándonos en el subtotal y el porcentaje de los ajustes.
        if (settings.serviceFeePercentage > 0) {
          const fee =
            this.cartService.subTotal() * (settings.serviceFeePercentage / 100);
          this.serviceFee.set(fee);
        }

        // 4. Desactivamos el estado de carga una vez que todos los datos están listos.
        this.isLoading.set(false);
      },
      // `error` se ejecuta si CUALQUIERA de las dos llamadas a la API falla.
      error: (err) => {
        this.toastService.show(
          'Error al cargar los datos del checkout.',
          'error'
        );
        this.isLoading.set(false); // Es importante desactivar la carga también en caso de error.
        console.error('Error en forkJoin de checkout:', err);
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

    // --- ¡VOLVEMOS A CREAR EL PEDIDO DIRECTAMENTE! ---
    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        this.toastService.show('¡Pedido realizado con éxito!', 'success');
        this.cartService.clearCart();
        // Redirigimos a la página de confirmación con el ID del pedido creado.
        this.router.navigate(['/order-confirmation', savedOrder._id]);
      },
      error: (err) => {
        // Mostramos el mensaje de error específico que viene del backend.
        this.toastService.show(
          err.error?.message || 'Hubo un error al crear tu pedido.',
          'error'
        );
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
}
