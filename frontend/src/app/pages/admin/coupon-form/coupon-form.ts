import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// CORREGIDO: Importamos el SERVICIO, no la interfaz.
import { Coupon } from '../../../services/coupon';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  // CORREGIDO: Añadimos RouterLink para los enlaces del HTML
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './coupon-form.html',
  styleUrl: '../product-form/product-form.scss'
})
// CORREGIDO: Usamos el nombre de clase convencional
export class couponForm implements OnInit {
  private router = inject(Router);
  // CORREGIDO: Inyectamos el SERVICIO
  private couponService = inject(Coupon);
  private route = inject(ActivatedRoute);

  couponForm = new FormGroup({
    code: new FormControl('', Validators.required),
    discountType: new FormControl('Porcentaje', Validators.required),
    value: new FormControl(0, [Validators.required, Validators.min(0)]),
    expirationDate: new FormControl(''),
    usageLimit: new FormControl<number | null>(null) // Tipado más estricto
  });

  // CORREGIDO: Declaramos las propiedades que faltaban
  couponId: string | null = null;
  isEditMode = false;

  ngOnInit(): void {
    // Leemos el ID de la URL
    this.couponId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.couponId;

    if (this.isEditMode && this.couponId) {
      this.couponService.getCouponById(this.couponId).subscribe(coupon => {
        const formattedDate = coupon.expirationDate 
          ? new Date(coupon.expirationDate).toISOString().split('T')[0] 
          : '';
        
        this.couponForm.patchValue({
          ...coupon,
          expirationDate: formattedDate
        });
      });
    }
  }

  handleSubmit(): void {
    if (this.couponForm.invalid) {
      return;
    }

    const formValue = this.couponForm.value;
    const couponData = {
      ...formValue,
      expirationDate: formValue.expirationDate || null,
      usageLimit: formValue.usageLimit || null,
    };

    if (this.isEditMode && this.couponId) {
      this.couponService.updateCoupon(this.couponId, couponData).subscribe({
        next: () => {
          console.log('Cupón actualizado con éxito');
          this.router.navigate(['/admin/coupons']);
        },
        error: (err) => console.error('Error al actualizar el cupón:', err)
      });
    } else {
      this.couponService.createCoupon(couponData).subscribe({
        next: () => {
          console.log('Cupón creado con éxito');
          this.router.navigate(['/admin/coupons']);
        },
        error: (err) => console.error('Error al crear el cupón:', err)
      });
    }
  }
}