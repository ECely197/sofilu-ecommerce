/**
 * @fileoverview Servicio de Almacenamiento (Storage).
 * Encapsula la lógica para interactuar con Firebase Cloud Storage,
 * principalmente para la subida de archivos como imágenes de productos.
 */
import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage: Storage = inject(Storage);

  constructor() {}

  /**
   * Sube un archivo a Firebase Storage y devuelve la URL de descarga pública.
   * @param file El archivo (ej. una imagen) a subir.
   * @returns Un Observable que emite la URL de descarga una vez que la subida se completa.
   */
  uploadImage(file: File): Observable<string> {
    // Crea una ruta única para el archivo para evitar colisiones de nombres.
    const filePath = `product-images/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // Usa `from` de RxJS para convertir la Promesa de `uploadBytes` en un Observable.
    return from(uploadBytes(storageRef, file)).pipe(
      // Una vez que la subida termina, `switchMap` cambia a un nuevo Observable
      // que obtiene la URL de descarga del archivo.
      switchMap((snapshot) => from(getDownloadURL(snapshot.ref)))
    );
  }
}
