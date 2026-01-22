import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Coupon } from '../../../services/coupon';
import { AuthService } from '../../../services/auth';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-my-coupons',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './my-coupons.html',
  styleUrl: './my-coupons.scss',
})
export class MyCouponsComponent implements OnInit {
  private couponService = inject(Coupon);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  coupons = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadCoupons(user.uid);
      }
    });
  }

  loadCoupons(uid: string) {
    this.isLoading.set(true);
    this.couponService.getCouponsForUser(uid).subscribe({
      next: (data) => {
        this.coupons.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.toastService.show('¡Código copiado al portapapeles!', 'success');
    });
  }

  isValid(coupon: any): boolean {
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit)
      return false;
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date())
      return false;
    return true;
  }
}
