// Contenido de depuración para: src/app/pages/admin/invoice-view/invoice-view.component.ts

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

  // LOG 4: Verificamos si el componente se está creando
  constructor() {
    console.log(
      '--- InvoiceViewComponent: El constructor ha sido llamado. El componente se está creando. ---'
    );
  }

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    console.log(
      '--- InvoiceViewComponent: ngOnInit - ID de la orden obtenido de la URL:',
      orderId
    ); // LOG 5

    if (orderId) {
      this.isLoading.set(true);
      this.orderService.getOrderById(orderId).subscribe({
        next: (data) => {
          console.log(
            '--- InvoiceViewComponent: ngOnInit - Datos del pedido recibidos del backend:',
            data
          ); // LOG 6 (Éxito)
          this.order.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(
            '--- InvoiceViewComponent: ngOnInit - ERROR al cargar el pedido:',
            err
          ); // LOG 7 (Fallo)
          this.isLoading.set(false);
        },
      });
    } else {
      console.error(
        '--- InvoiceViewComponent: ngOnInit - No se encontró un ID de orden en la URL.'
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
