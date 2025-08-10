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
  // Construimos la ruta directamente aquí
  const filePath = `product-images/${Date.now()}_${file.name}`;
  const storageRef = ref(this.storage, filePath);
  
  return from(uploadBytes(storageRef, file)).pipe(
    switchMap(snapshot => from(getDownloadURL(snapshot.ref)))
  );
}
}