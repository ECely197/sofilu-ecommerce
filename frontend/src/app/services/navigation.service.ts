// En: frontend/src/app/services/navigation.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../interfaces/product.interface';

// --- TIPOS DE DATOS ---
export interface SubCategory {
  id: string;
  name: string;
  products: Product[];
}
export interface NavItem {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/navigation`;

  getNavigationData(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(this.apiUrl);
  }
}
