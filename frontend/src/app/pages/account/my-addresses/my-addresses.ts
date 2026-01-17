// En: frontend/src/app/pages/account/my-addresses/my-addresses.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Customer, Address } from '../../../services/customer'; // Asegúrate de que Address se importa
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';
import { UiState } from '../../../services/ui-state';

@Component({
  selector: 'app-my-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './my-addresses.html',
  styleUrl: './my-addresses.scss',
})
export class MyAddressesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(Customer);
  private toastService = inject(ToastService);
  private uiState = inject(UiState);

  addresses = signal<Address[]>([]);
  isLoading = signal(true);
  isFormVisible = signal(false);
  editingAddressId = signal<string | null>(null);
  addressForm!: FormGroup;

  ngOnInit() {
    // ¡AÑADIMOS 'email' AL FORMULARIO CON VALIDACIÓN!
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], // <-- Campo nuevo
      streetAddress: ['', Validators.required],
      addressDetails: [''],
      department: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
    });
    this.loadAddresses();
  }

  loadAddresses() {
    this.isLoading.set(true);
    this.customerService.getAddresses().subscribe((data) => {
      this.addresses.set(data);
      this.isLoading.set(false);
    });
  }

  showAddForm() {
    this.editingAddressId.set(null);
    this.addressForm.reset();
    this.isFormVisible.set(true);
    this.uiState.setModalState(true);
  }

  showEditForm(address: Address) {
    // Tipado fuerte aquí
    this.editingAddressId.set(address._id);
    this.addressForm.patchValue(address);
    this.isFormVisible.set(true);
    this.uiState.setModalState(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
    this.uiState.setModalState(false);
  }

  handleSubmit() {
    if (this.addressForm.invalid) {
      this.toastService.show('Por favor, revisa todos los campos.', 'error');
      return;
    }

    const operation$ = this.editingAddressId()
      ? this.customerService.updateAddress(
          this.editingAddressId()!,
          this.addressForm.value
        )
      : this.customerService.addAddress(this.addressForm.value);

    operation$.subscribe({
      next: (updatedAddresses) => {
        this.addresses.set(updatedAddresses);
        this.toastService.show('¡Dirección guardada con éxito!', 'success');
        this.hideForm();
      },
      error: () => {
        this.toastService.show('No se pudo guardar la dirección.', 'error');
      },
    });
  }

  deleteAddress(addressId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?'))
      return;
    this.customerService
      .deleteAddress(addressId)
      .subscribe((updatedAddresses) => {
        this.addresses.set(updatedAddresses);
        this.toastService.show('Dirección eliminada.', 'success');
      });
  }

  setPreferred(addressId: string) {
    this.customerService
      .setPreferredAddress(addressId)
      .subscribe((updatedAddresses) => {
        this.addresses.set(updatedAddresses);
        this.toastService.show('Dirección marcada como preferida.', 'success');
      });
  }
}
