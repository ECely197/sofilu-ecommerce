/**
 * @fileoverview Servicio del Modal de Detalles del Cliente.
 * Gestiona la visibilidad de un modal que muestra información detallada
 * de un cliente específico, usado en el panel de administración.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CustomerDetailModalService {
  /**
   * @property {WritableSignal<string | null>} activeCustomerId
   * Un signal que almacena el UID del cliente a mostrar.
   * Si es `null`, el modal está cerrado.
   */
  activeCustomerId = signal<string | null>(null);

  /**
   * Abre el modal para un cliente específico.
   * @param uid El UID del cliente cuyos detalles se quieren ver.
   */
  open(uid: string): void {
    document.body.style.overflow = 'hidden'; // Previene el scroll del fondo.
    this.activeCustomerId.set(uid);
  }

  /** Cierra el modal. */
  close(): void {
    document.body.style.overflow = ''; // Restaura el scroll del fondo.
    this.activeCustomerId.set(null);
  }
}
