import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss'
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  public orders: any[] = []; // Usamos 'any' por ahora

  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.orderService.getOrders().subscribe(data => {
      this.orders = data;
      this.cdr.detectChanges();
    });

  }
  deleteOrder(orderId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido permanentemente?')) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.orders = this.orders.filter(order => order._id !== orderId);
          this.cdr.detectChanges();
        },
        error: (err) => alert('Error al eliminar el pedido.')
      });
      this.cdr.detectChanges();
    }
  }
}