// Contenido para: invoice-view.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../services/order';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-view.html',
  styleUrl: './invoice-view.scss',
})
export class InvoiceViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order = signal<any | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    console.log(
      '--- INVOICE VIEW: ID de la orden obtenido de la URL:',
      orderId
    ); // LOG 1

    if (orderId) {
      this.isLoading.set(true); // Nos aseguramos de que el estado de carga inicie
      this.orderService.getOrderById(orderId).subscribe({
        next: (data) => {
          console.log(
            '--- INVOICE VIEW: Datos del pedido recibidos del backend:',
            data
          ); // LOG 2
          this.order.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('--- INVOICE VIEW: ERROR al cargar el pedido:', err); // LOG 3 (Error)
          this.isLoading.set(false);
        },
      });
    } else {
      console.error(
        '--- INVOICE VIEW: No se encontró un ID de orden en la URL.'
      );
      this.isLoading.set(false);
    }
  }

  printPage(): void {
    window.print();
  }

  objectKeys(obj: object): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}
