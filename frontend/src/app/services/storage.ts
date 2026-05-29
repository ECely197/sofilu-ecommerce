/**
 * @fileoverview Servicio de Almacenamiento (Storage).
 * Encapsula la lógica para interactuar con la subida de archivos,
 * delegando la conversión y almacenamiento en el backend de Node.js.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private http = inject(HttpClient);

  constructor() {}

  /**
   * Sube una imagen al backend para ser procesada a WebP y almacenada en Firebase Storage.
   * @param file El archivo (imagen) a subir.
   * @returns Un Observable que emite la URL de descarga pública.
   */
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<{ imageUrl: string }>(`${environment.apiUrl}/upload`, formData)
      .pipe(map((response) => response.imageUrl));
  }
}
