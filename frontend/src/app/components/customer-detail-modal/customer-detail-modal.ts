import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDetailModalService } from '../../services/customer-detail-modal.service';
import { Customer } from '../../services/customer';
import { Coupon } from '../../services/coupon'; // Importamos CouponService
import { ToastService } from '../../services/toast.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RippleDirective } from '../../directives/ripple'; // Importamos Ripple
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-customer-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './customer-detail-modal.html',
  styleUrl: './customer-detail-modal.scss',
  animations: [
    trigger('flyInOut', [
      state('void', style({ transform: 'translateY(100%)', opacity: 0.5 })),
      transition(
        'void => *',
        animate(
          '400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ),
      transition(
        '* => void',
        animate(
          '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ transform: 'translateY(100%)', opacity: 0 }),
        ),
      ),
    ]),
  ],
})
export class CustomerDetailModalComponent {
  public customerDetailModalService = inject(CustomerDetailModalService);
  private customerService = inject(Customer);
  private couponService = inject(Coupon); // Inyectar CouponService
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  customerDetails = signal<any | null>(null);
  isLoading = signal(false);
  isCreatingCoupon = signal(false); // Controla si se muestra el formulario
  activeCoupons = signal<any[]>([]);

  // Formulario para el cupón rápido
  couponForm: FormGroup;

  constructor() {
    this.couponForm = this.fb.group({
      code: ['', Validators.required],
      discountType: ['Porcentaje', Validators.required],
      value: [10, [Validators.required, Validators.min(1)]],
      appliesTo: ['Subtotal', Validators.required],
    });

    effect(() => {
      const uid = this.customerDetailModalService.activeCustomerId();
      if (uid) {
        this.isLoading.set(true);
        this.isCreatingCoupon.set(false);

        // 1. Cargar detalles del cliente
        this.customerService.getCustomerDetails(uid).subscribe({
          next: (details) => {
            this.customerDetails.set(details);
            // Pre-llenar código...
            const namePart = (details.firstName || 'CLIENTE')
              .split(' ')[0]
              .toUpperCase();
            this.couponForm.patchValue({ code: `${namePart}-VIP` });

            // 2. CARGAR CUPONES ACTIVOS DEL USUARIO (NUEVO)
            this.loadUserCoupons(uid);
          },
          error: () => this.isLoading.set(false),
        });
      } else {
        this.customerDetails.set(null);
        this.activeCoupons.set([]);
      }
    });
  }

  loadUserCoupons(uid: string) {
    this.couponService.getCouponsForUser(uid).subscribe({
      next: (coupons) => {
        this.activeCoupons.set(coupons);
        this.isLoading.set(false); // Terminamos carga aquí
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggleCouponForm() {
    this.isCreatingCoupon.update((v) => !v);
  }

  createExclusiveCoupon() {
    if (this.couponForm.invalid) return;

    const details = this.customerDetails();
    if (!details) return;

    const payload = {
      ...this.couponForm.value,
      allowedUsers: [details.uid], // ¡AQUÍ ESTÁ LA MAGIA!
      usageLimit: 1, // Por defecto, uso único
    };

    this.couponService.createCoupon(payload).subscribe({
      next: () => {
        this.toastService.show(
          `Cupón exclusivo enviado a ${details.firstName || 'cliente'}.`,
          'success',
        );
        this.isCreatingCoupon.set(false);
        this.loadUserCoupons(details.uid);
        // Opcional: Recargar detalles para ver si quieres mostrarlo en una lista
      },

      error: (err) => {
        this.toastService.show(
          err.error?.message || 'Error creando cupón',
          'error',
        );
      },
    });
  }
}
