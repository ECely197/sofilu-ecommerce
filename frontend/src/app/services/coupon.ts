import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class Coupon {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/coupons`;

  searchCoupons(queryParams: {
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

  validateCoupon(code: string): Observable<any> {
    const url = `${this.apiUrl}/validate`;
    return this.http.post<any>(url, { code });
  }
}
