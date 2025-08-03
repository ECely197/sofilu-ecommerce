import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: Storage = inject(Storage);

  constructor() { }

  // Este método recibe un archivo y devuelve un Observable con la URL de descarga
  uploadImage(file: File): Observable<string> {
    // Creamos una ruta única para el archivo en Firebase Storage.
    // Ej: 'product-images/1678886400000_nombreDelArchivo.jpg'
    const filePath = `product-images/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // 'uploadBytes' sube el archivo. Devuelve una promesa.
    // Usamos 'from' de rxjs para convertir la promesa en un Observable.
    return from(uploadBytes(storageRef, file)).pipe(
      // 'switchMap' nos permite encadenar otro Observable.
      // Una vez que el archivo se ha subido, usamos el resultado ('snapshot')
      // para pedir la URL de descarga pública con 'getDownloadURL'.
      switchMap(snapshot => from(getDownloadURL(snapshot.ref)))
    );
  }
}