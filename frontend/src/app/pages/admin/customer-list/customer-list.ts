import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { Customer } from '../../../services/customer';
import { RippleDirective } from '../../../directives/ripple';

import { FormControl, ReactiveFormsModule } from '@angular/forms'; // ¡Importante!
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
} from 'rxjs/operators';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RippleDirective, ReactiveFormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss', // Apuntamos a su propio archivo SCSS
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class CustomerList implements OnInit {
  private customerService = inject(Customer);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  customers = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  searchControl = new FormControl('');

  ngOnInit() {
    // La magia de la búsqueda reactiva
    this.searchControl.valueChanges
      .pipe(
        // Empieza inmediatamente con un valor vacío
        startWith(''),
        // Espera 300ms después de que el usuario deja de teclear
        debounceTime(300),
        // Solo emite si el valor ha cambiado
        distinctUntilChanged(),
        // Muestra el loader
        switchMap((searchTerm) => {
          this.isLoading.set(true);
          // Llama al servicio de búsqueda. Si el término es nulo o vacío, lo maneja.
          return this.customerService.searchCustomers({
            search: searchTerm || '',
          });
        })
      )
      .subscribe({
        next: (data) => {
          this.customers.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al buscar clientes:', err);
          this.isLoading.set(false);
        },
      });
  }

  async toggleAdmin(customer: any): Promise<void> {
    const action = customer.isAdmin ? 'quitar el rol de' : 'convertir en';
    const confirmed = await this.confirmationService.confirm({
      title: `¿Confirmar cambio de rol?`,
      message: `Estás a punto de ${action} administrador a ${customer.email}.`,
      confirmText: 'Sí, confirmar',
    });

    if (confirmed) {
      this.customerService.toggleAdminRole(customer.uid).subscribe({
        next: () => {
          this.toastService.show('Rol de usuario actualizado.', 'success');
          // Actualizamos el estado localmente para reflejar el cambio sin recargar
          customer.isAdmin = !customer.isAdmin;
        },
        error: () =>
          this.toastService.show('Error al cambiar el rol.', 'error'),
      });
    }
  }

  async toggleDisable(customer: any): Promise<void> {
    const action = customer.disabled ? 'habilitar' : 'deshabilitar';
    const confirmed = await this.confirmationService.confirm({
      title: `¿Confirmar ${action}?`,
      message: `Estás a punto de ${action} la cuenta de ${customer.email}.`,
      confirmText: `Sí, ${action}`,
    });

    if (confirmed) {
      this.customerService.toggleDisableUser(customer.uid).subscribe({
        next: () => {
          this.toastService.show('Estado del usuario actualizado.', 'success');
          customer.disabled = !customer.disabled;
        },
        error: () =>
          this.toastService.show('Error al cambiar el estado.', 'error'),
      });
    }
  }

  viewDetails(customer: any): void {
    // Lógica para abrir el modal, que implementaremos en el siguiente paso
    console.log('Ver detalles de:', customer);
    // this.customerDetailModalService.open(customer.uid);
  }

  fetchCustomers(): void {
    this.isLoading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los clientes:', err);
        this.isLoading.set(false);
      },
    });
  }
}
