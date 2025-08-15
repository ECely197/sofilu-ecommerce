// Contenido completo para: src/app/pages/admin/coupon-list/coupon-list.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { Coupon } from '../../../services/coupon';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './coupon-list.html',
  styleUrl: './coupon-list.scss', // Apuntamos a su propio archivo
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class CouponList implements OnInit {
  private couponService = inject(Coupon);

  coupons = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchCoupons();
  }

  fetchCoupons(): void {
    this.isLoading.set(true);
    this.couponService.getCoupons().subscribe({
      next: (data) => {
        this.coupons.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los cupones:', err);
        this.isLoading.set(false);
      },
    });
  }

  deleteCoupon(couponId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este cupón?')) {
      this.couponService.deleteCoupon(couponId).subscribe({
        next: () => {
          this.coupons.update((currentCoupons) =>
            currentCoupons.filter((c) => c._id !== couponId)
          );
        },
        error: (err) => console.error('Error al eliminar el cupón:', err),
      });
    }
  }
}
