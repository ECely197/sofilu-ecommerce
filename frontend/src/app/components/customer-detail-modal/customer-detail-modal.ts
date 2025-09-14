// En: customer-detail-modal.component.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDetailModalService } from '../../services/customer-detail-modal.service';
import { Customer } from '../../services/customer';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-customer-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-detail-modal.html',
  styleUrl: './customer-detail-modal.scss',

  // --- ¡AÑADE ESTE BLOQUE COMPLETO! ---
  animations: [
    trigger('flyInOut', [
      state('void', style({ transform: 'translateY(100%)', opacity: 0.5 })),
      transition(
        'void => *',
        animate(
          '400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ),
      transition(
        '* => void',
        animate(
          '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ transform: 'translateY(100%)', opacity: 0 })
        )
      ),
    ]),
  ],
})
export class CustomerDetailModalComponent {
  public customerDetailModalService = inject(CustomerDetailModalService);
  private customerService = inject(Customer);

  customerDetails = signal<any | null>(null);
  isLoading = signal(false);

  constructor() {
    // Usamos 'effect' para reaccionar cuando el ID del cliente activo cambia
    effect(() => {
      const uid = this.customerDetailModalService.activeCustomerId();
      if (uid) {
        this.isLoading.set(true);
        this.customerService.getCustomerDetails(uid).subscribe({
          next: (details) => {
            this.customerDetails.set(details);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
            // Aquí podrías usar tu toast service para mostrar un error
            console.error('No se pudieron cargar los detalles del cliente.');
          },
        });
      } else {
        this.customerDetails.set(null); // Limpiamos los datos cuando se cierra el modal
      }
    });
  }
}
