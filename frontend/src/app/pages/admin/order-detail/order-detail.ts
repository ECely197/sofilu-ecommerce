import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute} from '@angular/router';
// ¡Asegúrate de que FormGroup, FormControl y ReactiveFormsModule estén importados!
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderService } from '../../../services/order';

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
  // Declaramos el FormGroup, pero lo inicializaremos en ngOnInit
  statusForm!: FormGroup;

  orderStatuses = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe(data => {
        this.order = data;

        // Inicializamos el formulario aquí, con el valor y un validador
        this.statusForm = new FormGroup({
          status: new FormControl(this.order.status, [Validators.required])
        });

        this.cdr.detectChanges();
      });
    }
  }

  // Este es el método que se llama al hacer clic
  updateStatus(): void {
    console.log('Intentando actualizar estado...'); // Log para depurar

    // Añadimos una guarda para asegurarnos de que el formulario existe
    if (!this.statusForm) {
      console.error('El formulario de estado no está inicializado.');
      return;
    }

    if (this.statusForm.valid && this.order) {
      const newStatus = this.statusForm.value.status;
      if (newStatus) {
        this.orderService.updateOrderStatus(this.order._id, newStatus)
          .subscribe(updatedOrder => {
            this.order = updatedOrder;
            // Rellenamos el formulario de nuevo con el nuevo estado
            this.statusForm.patchValue({ status: this.order.status });
            alert('¡Estado del pedido actualizado con éxito!');
          });
      }
    } else {
      console.log('El formulario no es válido:', this.statusForm.errors);
    }
  }
}