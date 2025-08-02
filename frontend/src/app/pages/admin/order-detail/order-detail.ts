import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute} from '@angular/router';
import { OrderService } from '../../../services/order';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss'
})
export class OrderDetail implements OnInit {
 private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  public order: any;
  // 1. Declaramos el FormGroup, pero NO lo inicializamos aquí.
  statusForm!: FormGroup; 

  orderStatuses = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe(data => {
        this.order = data;
        
        // 2. INICIALIZAMOS EL FORMULARIO AQUÍ, una vez que tenemos los datos.
        this.statusForm = new FormGroup({
          // Le damos el estado actual del pedido como valor inicial.
          status: new FormControl(this.order.status) 
        });

        this.cdr.detectChanges();
      });
    }
  }

  updateStatus(): void {
    // La lógica de 'updateStatus' no necesita cambiar
    if (this.statusForm.valid && this.order) {
      const newStatus = this.statusForm.value.status;
      if (newStatus) {
        this.orderService.updateOrderStatus(this.order._id, newStatus)
          .subscribe(updatedOrder => {
            this.order = updatedOrder;
            alert('¡Estado del pedido actualizado con éxito!');
            // Volvemos a inicializar el formulario con el nuevo estado
            this.statusForm.patchValue({ status: this.order.status });
          });
      }
    }
  }
  
}
