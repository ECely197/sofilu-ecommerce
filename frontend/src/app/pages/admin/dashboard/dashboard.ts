// En: frontend/src/app/pages/admin/dashboard/dashboard.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
} from '@angular/animations';
import { VendorPerformanceComponent } from '../../../components/admin/vendor-performance/vendor-performance';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RippleDirective,
    VendorPerformanceComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        query('.stat-card, .card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate(
              '500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class Dashboard implements OnInit {
  private orderService = inject(OrderService);

  summary = signal<any | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.orderService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el resumen del dashboard', err);
        this.isLoading.set(false);
      },
    });
  }
}
