import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order';
import { RippleDirective } from '../../../directives/ripple';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

// --- NUEVAS IMPORTACIONES CORRECTAS (Versión 6+) ---
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Usamos BaseChartDirective en lugar de NgChartsModule
  imports: [
    CommonModule,
    RippleDirective,
    ReactiveFormsModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  private orderService = inject(OrderService);

  summary = signal<any>(null);
  isLoading = signal(true);

  dateRangeForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });

  // --- CONFIGURACIÓN DE GRÁFICOS (Estructura v6) ---

  // 1. Gráfico de Pastel (Categorías)
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false, // Para que se adapte al contenedor
    plugins: { legend: { position: 'bottom' } },
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  // 2. Gráfico de Barras (Top Productos)
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }, // Ocultar leyenda si es obvio
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Ventas', backgroundColor: '#333' }],
  };

  constructor() {
    this.dateRangeForm.valueChanges.subscribe((val) => {
      if (val.startDate && val.endDate)
        this.loadSummary(val.startDate, val.endDate);
    });
  }

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary(start?: string, end?: string) {
    this.isLoading.set(true);
    this.orderService.getDashboardSummary(start, end).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.setupCharts(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      },
    });
  }

  setupCharts(data: any) {
    // Configurar Gráfico de Categorías
    if (data.categoryStats && data.categoryStats.length > 0) {
      this.pieChartData = {
        labels: data.categoryStats.map((c: any) => c._id),
        datasets: [
          {
            data: data.categoryStats.map((c: any) => c.totalRevenue),
            backgroundColor: [
              '#FFD1DC',
              '#A0D2DB',
              '#B4C8A6',
              '#C7C0FE',
              '#EAC696',
            ],
            hoverBackgroundColor: [
              '#ffc1cc',
              '#90c2cb',
              '#a4b896',
              '#b7b0ee',
              '#dab986',
            ],
          },
        ],
      };
    } else {
      // Datos vacíos por defecto para que no falle
      this.pieChartData = {
        labels: ['Sin datos'],
        datasets: [{ data: [1], backgroundColor: ['#eee'] }],
      };
    }

    // Configurar Gráfico de Productos
    if (data.topProducts && data.topProducts.length > 0) {
      this.barChartData = {
        labels: data.topProducts.map((p: any) => p.name),
        datasets: [
          {
            data: data.topProducts.map((p: any) => p.totalSold),
            label: 'Unidades',
            backgroundColor: '#333',
            borderRadius: 8,
          },
        ],
      };
    }
  }

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

    // Ajuste de zona horaria simple
    const format = (d: Date) => d.toISOString().split('T')[0];

    this.dateRangeForm.setValue({
      startDate: format(startDate),
      endDate: format(new Date()),
    });
  }
}
