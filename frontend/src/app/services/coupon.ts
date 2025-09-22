/**
 * @fileoverview Servicio de Cupones.
 * Maneja todas las operaciones CRUD y de validación para los cupones de descuento.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
// El nombre de la clase "Coupon" se mantiene exactamente como el original.
export class Coupon {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/coupons`;

  /**
   * Busca cupones en el backend utilizando parámetros de consulta.
   * @param queryParams Un objeto clave-valor con los filtros a aplicar.
   */
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

  /** Obtiene todos los cupones. */
  getCoupons(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /** Obtiene un cupón específico por su ID. */
  getCouponById(couponId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${couponId}`);
  }

  /** Crea un nuevo cupón. */
  createCoupon(couponData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, couponData);
  }

  /** Actualiza un cupón existente. */
  updateCoupon(couponId: string, couponData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${couponId}`, couponData);
  }

  /** Elimina un cupón. */
  deleteCoupon(couponId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${couponId}`);
  }

  /**
   * Valida un código de cupón contra el backend.
   * @param code El código del cupón a validar.
   */
  validateCoupon(code: string): Observable<any> {
    const url = `${this.apiUrl}/validate`;
    return this.http.post<any>(url, { code });
  }
}
