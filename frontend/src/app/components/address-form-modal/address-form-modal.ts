import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Customer, Address } from '../../services/customer';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './address-form-modal.html',
  styleUrl: './address-form-modal.scss',
})
export class AddressFormModalComponent {
  private fb = inject(FormBuilder);
  private customerService = inject(Customer);
  private toastService = inject(ToastService);

  // Señal para controlar la visibilidad
  isOpen = signal(false);

  // Evento para notificar cuando se crea una nueva dirección
  @Output() addressCreated = new EventEmitter<Address>();

  addressForm: FormGroup;

  constructor() {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      streetAddress: ['', Validators.required],
      addressDetails: [''],
      department: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
    });
  }

  // Métodos para abrir y cerrar el modal
  open() {
    this.addressForm.reset();
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  handleSubmit() {
    if (this.addressForm.invalid) {
      this.toastService.show('Por favor, completa todos los campos.', 'error');
      return;
    }

    this.customerService.addAddress(this.addressForm.value).subscribe({
      next: (updatedAddresses) => {
        // Encontramos la última dirección añadida (la nueva)
        const newAddress = updatedAddresses[updatedAddresses.length - 1];
        if (newAddress) {
          this.addressCreated.emit(newAddress); // Emitimos la dirección
        }
        this.toastService.show('¡Dirección guardada!', 'success');
        this.close();
      },
      error: () =>
        this.toastService.show('No se pudo guardar la dirección.', 'error'),
    });
  }
}
