// En: frontend/src/app/services/json-ld.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class JsonLdService {
  // Le damos un ID único a nuestro script para poder encontrarlo y quitarlo después
  private readonly scriptId = 'schema-json-ld';

  constructor(@Inject(DOCUMENT) private document: Document) {}

  // Añade o actualiza el script de datos estructurados
  setData(data: object): void {
    this.removeData(); // Primero, quitamos cualquier script antiguo

    const script = this.document.createElement('script');
    script.id = this.scriptId;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(data);

    this.document.head.appendChild(script);
  }

  // Elimina el script cuando ya no es necesario (ej: al salir de la página del producto)
  removeData(): void {
    const script = this.document.getElementById(this.scriptId);
    if (script) {
      this.document.head.removeChild(script);
    }
  }
}
