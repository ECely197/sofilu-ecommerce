/**
 * @fileoverview Servicio de Vendedores/Marcas.
 * Encapsula la comunicación con la API para gestionar los proveedores de productos.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// --- Interfaces para un tipado fuerte y claro ---

export interface Vendor {
  _id: string;
  name: string;
}

export interface VendorStats {
  vendorName: string;
  totalProducts: number;
  totalInventorySaleValue: number;
  totalInventoryCostValue: number;
}

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vendors`;

  /** Obtiene todos los vendedores. */
  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(this.apiUrl);
  }

  /**
   * Crea un nuevo vendedor.
   * @param vendorData Objeto que contiene el nombre del nuevo vendedor.
   */
  createVendor(vendorData: { name: string }): Observable<Vendor> {
    return this.http.post<Vendor>(this.apiUrl, vendorData);
  }

  /**
   * Elimina un vendedor.
   * @param vendorId El ID del vendedor a eliminar.
   */
  deleteVendor(vendorId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${vendorId}`);
  }

  /** Obtiene estadísticas de inventario agrupadas por vendedor. */
  getVendorStats(): Observable<VendorStats[]> {
    return this.http.get<VendorStats[]>(`${this.apiUrl}/stats`);
  }
}
