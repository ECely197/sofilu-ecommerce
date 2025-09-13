import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  streetAddress: string;
  addressDetails?: string;
  department: string;
  city: string;
  postalCode: string;
  isPreferred: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}
@Injectable({
  providedIn: 'root',
})
export class Customer {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  searchCustomers(queryParams: {
    [param: string]: string | number | boolean;
  }): Observable<any[]> {
    let params = new HttpParams();
    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        params = params.set(key, queryParams[key]);
      }
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- ¡NUEVOS MÉTODOS DE PERFIL! ---
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateUserProfile(
    profileData: Partial<UserProfile>
  ): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData);
  }

  // --- MÉTODOS DE DIRECCIONES SIMPLIFICADOS ---
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
