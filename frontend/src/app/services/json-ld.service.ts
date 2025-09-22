/**
 * @fileoverview Servicio de JSON-LD.
 * Se encarga de inyectar y gestionar dinámicamente scripts de "Datos Estructurados"
 * (Schema.org) en el `<head>` del documento. Esto es crucial para el SEO, ya que
 * ayuda a los motores de búsqueda a entender el contenido de una página (ej: un producto).
 */
import { Injectable, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class JsonLdService implements OnDestroy {
  private readonly scriptId = 'schema-json-ld';

  // Inyecta el objeto `DOCUMENT` para poder manipular el DOM de forma segura en Angular.
  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Inyecta o actualiza el script de datos estructurados en el `<head>`.
   * @param data Un objeto JavaScript que representa el schema JSON-LD.
   */
  setData(data: object): void {
    this.removeData(); // Siempre elimina el script anterior para evitar duplicados.

    const script = this.document.createElement('script');
    script.id = this.scriptId;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(data, null, 2); // `null, 2` formatea el JSON para legibilidad

    this.document.head.appendChild(script);
  }

  /** Elimina el script de datos estructurados del `<head>`. */
  removeData(): void {
    const script = this.document.getElementById(this.scriptId);
    if (script) {
      this.document.head.removeChild(script);
    }
  }

  /**
   * Hook del ciclo de vida. Asegura que el script se elimine si el servicio
   * es destruido, previniendo fugas de memoria en escenarios complejos.
   */
  ngOnDestroy(): void {
    this.removeData();
  }
}
