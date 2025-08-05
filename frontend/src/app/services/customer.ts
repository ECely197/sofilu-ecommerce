import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Customer {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`; 

  constructor() { }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
