/**
 * @fileoverview Servicio de Clientes (Usuarios).
 * Maneja la comunicación con la API para la gestión de datos de usuarios,
 * perfiles y direcciones.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth';

// --- Interfaces para un tipado fuerte y claro ---
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
// El nombre de la clase "Customer" se mantiene exactamente como el original.
export class Customer {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // Se mantiene aunque no se use directamente, por si lo necesitas en el futuro.
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  /**
   * Busca clientes en el backend utilizando parámetros de consulta.
   * @param queryParams Un objeto clave-valor con los filtros a aplicar.
   */
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

  /** Obtiene todos los clientes (usado por el admin). */
  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- MÉTODOS DE PERFIL DE USUARIO (CLIENTE) ---

  /** Obtiene el perfil del usuario actualmente autenticado. */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  /** Actualiza el perfil del usuario actualmente autenticado. */
  updateUserProfile(
    profileData: Partial<UserProfile>
  ): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData);
  }

  // --- MÉTODOS DE GESTIÓN DE DIRECCIONES (CLIENTE) ---

  /** Obtiene la lista de direcciones del usuario actual. */
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }

  /** Añade una nueva dirección. */
  addAddress(
    addressData: Omit<Address, '_id' | 'isPreferred'>
  ): Observable<Address[]> {
    return this.http.post<Address[]>(`${this.apiUrl}/addresses`, addressData);
  }

  /** Actualiza una dirección existente. */
  updateAddress(
    addressId: string,
    addressData: Partial<Address>
  ): Observable<Address[]> {
    return this.http.put<Address[]>(
      `${this.apiUrl}/addresses/${addressId}`,
      addressData
    );
  }

  /** Marca una dirección como la preferida. */
  setPreferredAddress(addressId: string): Observable<Address[]> {
    return this.http.patch<Address[]>(
      `${this.apiUrl}/addresses/${addressId}/set-preferred`,
      {}
    );
  }

  /** Elimina una dirección. */
  deleteAddress(addressId: string): Observable<Address[]> {
    return this.http.delete<Address[]>(`${this.apiUrl}/addresses/${addressId}`);
  }

  // --- MÉTODOS DE ADMINISTRACIÓN DE USUARIOS ---

  /** Obtiene los detalles completos de un cliente específico por su UID. */
  getCustomerDetails(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${uid}/details`);
  }

  /** Alterna el rol de administrador de un usuario. */
  toggleAdminRole(uid: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${uid}/toggle-admin`, {});
  }

  /** Habilita o deshabilita la cuenta de un usuario. */
  toggleDisableUser(uid: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${uid}/toggle-disable`, {});
  }
}
