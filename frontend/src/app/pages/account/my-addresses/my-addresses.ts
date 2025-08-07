import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Customer } from '../../../services/customer';
import { take, filter } from 'rxjs/operators';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-my-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-addresses.html',
  styleUrl: './my-addresses.scss'
})
export class MyAddressesComponent implements OnInit {
  private authService = inject(AuthService);
  private customerService = inject(Customer);
  private cdr = inject(ChangeDetectorRef);
  addresses: any[] = [];
  showForm = false;
  currentUser: User | null = null; // Para guardar el usuario actual

  addressForm: FormGroup;

  constructor() {
    // Creamos el formulario con todos los campos nuevos
    this.addressForm = new FormGroup({
      fullName: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      streetAddress: new FormControl('', Validators.required),
      addressDetails: new FormControl(''), // Opcional
      department: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      postalCode: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    // Nos suscribimos para obtener el usuario y luego sus direcciones
    this.authService.currentUser$.pipe(
      filter(user => user !== undefined), // Esperamos un estado definitivo
      take(1)
    ).subscribe(user => {
      this.currentUser = user; // Guardamos el usuario
      if (user) {
        this.customerService.getAddresses(user.uid).subscribe(data => {
          this.addresses = data;
          this.cdr.detectChanges();
        });
      }
    });
  }

  submitAddress(): void {
    if (this.addressForm.invalid || !this.currentUser) return;

    // Creamos el objeto con los datos del formulario
    const addressData = this.addressForm.getRawValue();

    this.customerService.addAddress(this.currentUser.uid, addressData).subscribe(updatedAddresses => {
      this.addresses = updatedAddresses;
      this.showForm = false;
      this.addressForm.reset();
      this.cdr.detectChanges();
    });
  }

  deleteAddress(addressId: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?') || !this.currentUser) return;

    this.customerService.deleteAddress(this.currentUser.uid, addressId)
      .subscribe(updatedAddresses => {
        this.addresses = updatedAddresses;
        this.cdr.detectChanges();
      });
  }
}