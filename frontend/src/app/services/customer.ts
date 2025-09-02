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

export interface Contact {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
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

  // --- ¡NUEVOS MÉTODOS PARA CONTACTOS! ---
  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl}/contacts`);
  }
  addContact(
    contactData: Omit<Contact, '_id' | 'isPreferred'>
  ): Observable<Contact[]> {
    return this.http.post<Contact[]>(`${this.apiUrl}/contacts`, contactData);
  }
  updateContact(
    contactId: string,
    contactData: Partial<Contact>
  ): Observable<Contact[]> {
    return this.http.put<Contact[]>(
      `${this.apiUrl}/contacts/${contactId}`,
      contactData
    );
  }
  deleteContact(contactId: string): Observable<Contact[]> {
    return this.http.delete<Contact[]>(`${this.apiUrl}/contacts/${contactId}`);
  }
  setPreferredContact(contactId: string): Observable<Contact[]> {
    return this.http.patch<Contact[]>(
      `${this.apiUrl}/contacts/${contactId}/set-preferred`,
      {}
    );
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
