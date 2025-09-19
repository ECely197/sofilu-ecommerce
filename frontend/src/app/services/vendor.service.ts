// En: frontend/src/app/services/vendor.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Vendor {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vendors`;

  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(this.apiUrl);
  }

  createVendor(vendorData: { name: string }): Observable<Vendor> {
    return this.http.post<Vendor>(this.apiUrl, vendorData);
  }

  deleteVendor(vendorId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${vendorId}`);
  }
}
