import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getAddresses(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${uid}/addresses`);
  }

  addAddress(uid: string, addressData: any): Observable<any[]> {
    return this.http.post<any[]>(
      `${this.apiUrl}/${uid}/addresses`,
      addressData
    );
  }

  // ¡NUEVO!
  updateAddress(
    uid: string,
    addressId: string,
    addressData: any
  ): Observable<any[]> {
    return this.http.put<any[]>(
      `${this.apiUrl}/${uid}/addresses/${addressId}`,
      addressData
    );
  }

  // ¡NUEVO!
  setPreferredAddress(uid: string, addressId: string): Observable<any[]> {
    return this.http.patch<any[]>(
      `${this.apiUrl}/${uid}/addresses/${addressId}/set-preferred`,
      {}
    );
  }

  deleteAddress(uid: string, addressId: string): Observable<any[]> {
    return this.http.delete<any[]>(
      `${this.apiUrl}/${uid}/addresses/${addressId}`
    );
  }
}
