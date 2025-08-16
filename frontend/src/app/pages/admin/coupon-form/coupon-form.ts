// Contenido completo para: src/app/pages/admin/coupon-form/coupon-form.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  trigger,
  transition,
  query,
  stagger,
  style,
  animate,
} from '@angular/animations';

import { Coupon } from '../../../services/coupon';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './coupon-form.html',
  styleUrl: './coupon-form.scss', // Apuntamos a su propio archivo
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        query('.card', [
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
export class couponForm implements OnInit {
  private router = inject(Router);
  private couponService = inject(Coupon);
  private route = inject(ActivatedRoute);

  couponForm!: FormGroup; // Se inicializa en ngOnInit
  isEditMode = signal(false);
  private couponId: string | null = null;

  ngOnInit(): void {
    this.couponForm = new FormGroup({
      code: new FormControl('', Validators.required),
      discountType: new FormControl('Porcentaje', Validators.required),
      value: new FormControl(null, [Validators.required, Validators.min(0)]),
      appliesTo: new FormControl('Subtotal', Validators.required),
      expirationDate: new FormControl(''),
      usageLimit: new FormControl<number | null>(null, [Validators.min(1)]),
    });

    this.couponId = this.route.snapshot.paramMap.get('id');
    if (this.couponId) {
      this.isEditMode.set(true);
      this.couponService.getCouponById(this.couponId).subscribe((coupon) => {
        const formattedDate = coupon.expirationDate
          ? new Date(coupon.expirationDate).toISOString().split('T')[0]
          : '';
        this.couponForm.patchValue({
          ...coupon,
          expirationDate: formattedDate,
        });
      });
    }
  }

  handleSubmit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    const formValue = this.couponForm.getRawValue();
    // Limpiamos valores nulos o vacíos antes de enviar
    const couponData = {
      ...formValue,
      expirationDate: formValue.expirationDate || null,
      usageLimit: formValue.usageLimit || null,
    };

    const operation = this.isEditMode()
      ? this.couponService.updateCoupon(this.couponId!, couponData)
      : this.couponService.createCoupon(couponData);

    operation.subscribe({
      next: () => {
        const action = this.isEditMode() ? 'actualizado' : 'creado';
        alert(`Cupón ${action} con éxito`);
        this.router.navigate(['/admin/coupons']);
      },
      error: (err) => {
        console.error(
          `Error al ${this.isEditMode() ? 'actualizar' : 'crear'} el cupón:`,
          err
        );
        alert('Ocurrió un error al guardar el cupón.');
      },
    });
  }
}
