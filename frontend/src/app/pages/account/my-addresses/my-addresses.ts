// Contenido completo y final para: src/app/pages/account/my-addresses/my-addresses.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { switchMap, take } from 'rxjs/operators';

import { Customer } from '../../../services/customer';
import { AuthService } from '../../../services/auth';
import { RippleDirective } from '../../../directives/ripple';

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
  private authService = inject(AuthService);

  addresses = signal<any[]>([]);
  isLoading = signal(true);
  isFormVisible = signal(false);
  editingAddressId = signal<string | null>(null);

  addressForm!: FormGroup;

  ngOnInit() {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      city: ['', Validators.required],
      streetAddress: ['', Validators.required],
      addressDetails: [''],
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
  }

  showEditForm(address: any) {
    this.editingAddressId.set(address._id);
    this.addressForm.patchValue(address);
    this.isFormVisible.set(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
  }

  handleSubmit() {
    if (this.addressForm.invalid) return;
    const operation$ = this.editingAddressId()
      ? this.customerService.updateAddress(
          this.editingAddressId()!,
          this.addressForm.value
        )
      : this.customerService.addAddress(this.addressForm.value);

    operation$.subscribe((updatedAddresses) => {
      this.addresses.set(updatedAddresses);
      this.hideForm();
    });
  }

  deleteAddress(addressId: string) {
    if (!confirm('¿Estás seguro?')) return;
    this.customerService
      .deleteAddress(addressId)
      .subscribe((updatedAddresses) => {
        this.addresses.set(updatedAddresses);
      });
  }

  setPreferred(addressId: string) {
    this.customerService
      .setPreferredAddress(addressId)
      .subscribe((updatedAddresses) => {
        this.addresses.set(updatedAddresses);
      });
  }
}
