import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

// --- INTERFACES para seguridad de tipos ---
interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  orderStatusCounts: { [key: string]: number };
  recentOrders: any[];
  totalProducts: number;
  inventorySaleValue: number;
  inventoryCostValue: number;
  couponPerformance: any[];
  vendorPerformance: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RippleDirective, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  private orderService = inject(OrderService);

  // --- Estado con Signals ---
  // El signal `summary` se inicializa con una estructura vacía para PREVENIR el error 'undefined'
  summary = signal<DashboardSummary | null>(null);
  isLoading = signal(true);

  // Formulario para el filtro de fechas
  dateRangeForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });

  constructor() {
    // Reacciona a los cambios en el formulario de fechas
    this.dateRangeForm.valueChanges.subscribe((values) => {
      const { startDate, endDate } = values;
      if (startDate && endDate) {
        this.loadSummary(startDate, endDate);
      }
    });
  }

  ngOnInit() {
    this.loadSummary(); // Carga inicial sin filtro
  }

  loadSummary(startDate?: string, endDate?: string) {
    this.isLoading.set(true);
    this.orderService.getDashboardSummary(startDate, endDate).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el resumen del dashboard:', err);
        this.isLoading.set(false);
      },
    });
  }

  // --- Métodos para filtros rápidos ---
  applyDateFilter(filter: 'day' | 'week' | 'month' | 'year') {
    const today = new Date();
    let startDate = new Date();

    switch (filter) {
      case 'day':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = new Date().toISOString().split('T')[0];

    this.dateRangeForm.setValue({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });
  }
}
