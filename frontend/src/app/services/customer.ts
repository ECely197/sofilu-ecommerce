import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  addressDetails?: string;
  department: string;
  city: string;
  postalCode: string;
  isPreferred: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class Customer {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- MÉTODOS DE DIRECCIONES ---
  // Las rutas de direcciones ahora se construyen a partir de la URL base

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }

  addAddress(
    addressData: Omit<Address, '_id' | 'isPreferred'>
  ): Observable<Address[]> {
    return this.http.post<Address[]>(`${this.apiUrl}/addresses`, addressData);
  }

  updateAddress(
    addressId: string,
    addressData: Partial<Address>
  ): Observable<Address[]> {
    return this.http.put<Address[]>(
      `${this.apiUrl}/addresses/${addressId}`,
      addressData
    );
  }

  setPreferredAddress(addressId: string): Observable<Address[]> {
    return this.http.patch<Address[]>(
      `${this.apiUrl}/addresses/${addressId}/set-preferred`,
      {}
    );
  }

  deleteAddress(addressId: string): Observable<Address[]> {
    return this.http.delete<Address[]>(`${this.apiUrl}/addresses/${addressId}`);
  }
}
