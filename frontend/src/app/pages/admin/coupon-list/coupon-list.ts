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

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
} from 'rxjs/operators';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective, ReactiveFormsModule],
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

  searchControl = new FormControl('');

  ngOnInit() {
    // La magia de la búsqueda reactiva
    this.searchControl.valueChanges
      .pipe(
        // Empieza inmediatamente con un valor vacío
        startWith(''),
        // Espera 300ms después de que el usuario deja de teclear
        debounceTime(300),
        // Solo emite si el valor ha cambiado
        distinctUntilChanged(),
        // Muestra el loader
        switchMap((searchTerm) => {
          this.isLoading.set(true);
          // Llama al servicio de búsqueda. Si el término es nulo o vacío, lo maneja.
          return this.couponService.searchCoupons({ search: searchTerm || '' });
        })
      )
      .subscribe({
        next: (data) => {
          this.coupons.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al buscar cupones:', err);
          this.isLoading.set(false);
        },
      });
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
