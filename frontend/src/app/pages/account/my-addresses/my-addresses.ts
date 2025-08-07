import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Customer } from '../../../services/customer';
import { take, filter } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-my-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './my-addresses.html',
  styleUrl: './my-addresses.scss'
})
export class MyAddressesComponent implements OnInit {
  private authService = inject(AuthService);
  private customerService = inject(Customer);

  addresses: any[] = [];
  isLoading = true;
  showForm = false;
  addressForm: FormGroup;
  currentUser: User | null = null;

  constructor() {
    this.addressForm = new FormGroup({
      fullName: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      streetAddress: new FormControl('', Validators.required),
      addressDetails: new FormControl(''),
      department: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      postalCode: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    console.log('MY-ADDRESSES: ngOnInit disparado. Esperando usuario...'); // Log #1
    this.authService.currentUser$.pipe(
      filter(user => user !== undefined),
      take(1)
    ).subscribe(user => {
      this.currentUser = user;
      if (user) {
        console.log('MY-ADDRESSES: Usuario encontrado. UID:', user.uid); // Log #2
        this.loadAddresses(user.uid);
      } else {
        console.log('MY-ADDRESSES: No se encontró usuario.'); // Log #2.1
        this.isLoading = false;
      }
    });
  }

  loadAddresses(uid: string): void {
    this.isLoading = true;
    this.customerService.getAddresses(uid).subscribe({
      next: (data) => {
        console.log('MY-ADDRESSES: Direcciones recibidas de la API:', data); // Log #4
        this.addresses = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('MY-ADDRESSES: ERROR al obtener direcciones', err); // Log de Error Frontend
        this.isLoading = false;
      }
    });
  }

   submitAddress(): void {
    console.log('ADDRESS FORM: Botón "Guardar Dirección" presionado.'); // Log #A

    if (this.addressForm.invalid) {
      console.error('ADDRESS FORM: El formulario es inválido. No se enviará.', this.addressForm.errors); // Log de Error
      return;
    }
    if (!this.currentUser) {
      console.error('ADDRESS FORM: No hay un usuario actual para asignar la dirección.'); // Log de Error
      return;
    }
    
    const addressData = this.addressForm.getRawValue();
    console.log('ADDRESS FORM: Datos del formulario a enviar:', addressData); // Log #B

    this.customerService.addAddress(this.currentUser.uid, addressData)
      .subscribe({
        next: (updatedAddresses) => {
          console.log('ADDRESS FORM: Dirección guardada con éxito. API devolvió:', updatedAddresses); // Log #D
          this.addresses = updatedAddresses;
          this.showForm = false;
          this.addressForm.reset();
        },
        error: (err) => {
          console.error('ADDRESS FORM: ERROR al guardar la dirección', err); // Log de Error Frontend
        }
      });
  }
  
  deleteAddress(addressId: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?') || !this.currentUser) return;

    this.customerService.deleteAddress(this.currentUser.uid, addressId)
      .subscribe(updatedAddresses => {
        this.addresses = updatedAddresses;
      });
  }
}