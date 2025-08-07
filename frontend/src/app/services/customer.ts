import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Customer {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() { }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- MÉTODOS NUEVOS PARA DIRECCIONES ---
  getAddresses(uid: string): Observable<any[]> {
    const url = `${this.apiUrl}/${uid}/addresses`;
    console.log('CUSTOMER SERVICE: Haciendo petición GET a:', url); // Log #3
    return this.http.get<any[]>(url);
  }

  addAddress(uid: string, addressData: any): Observable<any[]> {
    const url = `${this.apiUrl}/${uid}/addresses`;
    console.log('CUSTOMER SERVICE: Haciendo petición POST a:', url, 'con los datos:', addressData); // Log #C
    return this.http.post<any[]>(url, addressData);
  }

  deleteAddress(uid: string, addressId: string): Observable<any[]> {
    return this.http.delete<any[]>(`${this.apiUrl}/${uid}/addresses/${addressId}`);
  }
}
