import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Coupon } from '../../../services/coupon';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coupon-list.html',
  styleUrl: '../product-list/product-list.scss'
})
export class CouponList implements OnInit {
  private couponService = inject(Coupon);
  public coupons: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.couponService.getCoupons().subscribe(data => {
      this.coupons = data;
      this.cdr.detectChanges();
    });
  }
}