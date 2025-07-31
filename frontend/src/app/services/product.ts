import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';


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
  providedIn: 'root'
})
export class ProductServices {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/products';

  constructor() { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;

    return this.http.get<Product>(url);
  };

  getReviewsForProduct(productId: string): Observable<Review[]> {
    // La URL apunta a nuestra nueva API de reseñas
    return this.http.get<Review[]>(`http://localhost:3000/api/reviews/${productId}`);
  }

  addReview(productId: string, reviewData: any): Observable<Review> {
    // Hacemos una petición POST a la API para crear la nueva reseña
    return this.http.post<Review>(`http://localhost:3000/api/reviews/${productId}`, reviewData);
  }

}
