import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Coupon {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/coupons`; 

  getCoupons(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  // --- Crear un cupón ---
  createCoupon(couponData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, couponData);
  }

  getCouponById(couponId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${couponId}`);
  }

  // --- MÉTODO NUEVO: Actualizar un cupón ---
  updateCoupon(couponId: string, couponData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${couponId}`, couponData);
  }

  deleteCoupon(couponId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${couponId}`);
  }
}
