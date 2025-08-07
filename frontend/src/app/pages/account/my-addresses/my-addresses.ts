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
    this.authService.currentUser$.pipe(
      filter(user => user !== undefined),
      take(1)
    ).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadAddresses(user.uid);
      } else {
        this.isLoading = false;
      }
    });
  }

  loadAddresses(uid: string): void {
    this.isLoading = true;
    this.customerService.getAddresses(uid).subscribe(data => {
      this.addresses = data;
      this.isLoading = false;
    });
  }

  submitAddress(): void {
    if (this.addressForm.invalid || !this.currentUser) return;
    
    this.customerService.addAddress(this.currentUser.uid, this.addressForm.value)
      .subscribe(updatedAddresses => {
        this.addresses = updatedAddresses;
        this.showForm = false;
        this.addressForm.reset();
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