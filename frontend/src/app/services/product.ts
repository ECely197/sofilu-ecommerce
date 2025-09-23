/**
 * @fileoverview Servicio de Productos.
 * Encapsula todas las llamadas a la API REST relacionadas con la gestión
 * de productos y sus reseñas.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';
import { environment } from '../../environments/environment.prod';

export interface Review {
  _id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ProductServices {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  constructor() {}

  /** Obtiene una lista de todos los productos desde el backend. */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  /** Obtiene un único producto por su ID. */
  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url);
  }

  /** Obtiene todas las reseñas para un producto específico. */
  getReviewsForProduct(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${environment.apiUrl}/reviews/${productId}`
    );
  }

  /** Publica una nueva reseña para un producto. */
  addReview(productId: string, reviewData: any): Observable<Review> {
    return this.http.post<Review>(
      `${environment.apiUrl}/reviews/${productId}`,
      reviewData
    );
  }

  /** Crea un nuevo producto. (Ruta de Admin) */
  createProduct(productData: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productData);
  }

  /** Actualiza un producto existente por su ID. (Ruta de Admin) */
  updateProduct(
    productId: string,
    productData: Partial<Product>
  ): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${productId}`, productData);
  }

  /** Elimina un producto por su ID. (Ruta de Admin) */
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${productId}`);
  }

  /** Obtiene una lista limitada de productos destacados. */
  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/section/featured`);
  }

  /** Obtiene TODOS los productos destacados. */
  getAllFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/section/featured/all`);
  }

  /** Obtiene todos los productos que están en oferta. */
  getSaleProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${environment.apiUrl}/products/section/sale`
    );
  }

  /** Obtiene los productos de una categoría específica por su slug. */
  getProductsByCategory(slug: string): Observable<Product[]> {
    const url = `${this.apiUrl}/category/${slug}`;
    return this.http.get<Product[]>(url);
  }

  /**
   * Actualiza el estado de un producto (Activo/Agotado).
   * @param productId El ID del producto.
   * @param status El nuevo estado.
   */
  updateProductStatus(
    productId: string,
    status: 'Activo' | 'Agotado'
  ): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${productId}/status`, {
      status,
    });
  }

  /**
   * Realiza una búsqueda de productos en el backend.
   * Construye los parámetros de la URL a partir de un objeto.
   * @param queryParams Objeto con los parámetros de búsqueda (ej: { search: 'camiseta', category: 'abc' }).
   */
  searchProducts(queryParams: {
    [param: string]: string | number | boolean;
  }): Observable<Product[]> {
    let params = new HttpParams();
    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        params = params.set(key, queryParams[key]);
      }
    }
    return this.http.get<Product[]>(this.apiUrl, { params });
  }
}
