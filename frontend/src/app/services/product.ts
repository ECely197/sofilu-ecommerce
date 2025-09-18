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

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;

    return this.http.get<Product>(url);
  }

  getReviewsForProduct(productId: string): Observable<Review[]> {
    // La URL apunta a nuestra nueva API de reseñas
    return this.http.get<Review[]>(
      `${environment.apiUrl}/reviews/${productId}`
    );
  }

  addReview(productId: string, reviewData: any): Observable<Review> {
    // Hacemos una petición POST a la API para crear la nueva reseña
    return this.http.post<Review>(
      `${environment.apiUrl}/reviews/${productId}`,
      reviewData
    );
  }

  createProduct(productData: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productData);
  }

  updateProduct(
    productId: string,
    productData: Partial<Product>
  ): Observable<Product> {
    // Forma segura: Une la URL base y el ID.
    return this.http.put<Product>(`${this.apiUrl}/${productId}`, productData);
  }

  deleteProduct(productId: string): Observable<any> {
    // Hacemos una petición DELETE a la URL específica del producto.
    return this.http.delete<any>(`${this.apiUrl}/${productId}`);
  }

  getFeaturedProducts(): Observable<Product[]> {
    // Ahora tenemos dos. Para evitar confusiones, creemos un nuevo método.
    return this.http.get<Product[]>(`${this.apiUrl}/section/featured`);
  }

  // ¡NUEVO MÉTODO!
  getAllFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/section/featured/all`);
  }

  // --- MÉTODO NUEVO ---
  getSaleProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${environment.apiUrl}/products/section/sale`
    );
  }

  getProductsByCategory(slug: string): Observable<Product[]> {
    // Llamamos a la nueva ruta que creamos en el backend
    const url = `${this.apiUrl}/category/${slug}`;
    return this.http.get<Product[]>(url);
  }

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
