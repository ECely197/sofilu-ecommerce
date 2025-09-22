/**
 * @fileoverview Servicio del Modal Explorador de Productos.
 * Gestiona el estado de un modal reutilizable que puede mostrar una lista
 * de productos con un título (ej: "Productos Destacados", "Productos en Oferta").
 */
import { Injectable, signal } from '@angular/core';
import { Product } from '../interfaces/product.interface';

/** Define la estructura de los datos que el modal necesita para mostrarse. */
export interface ProductModalData {
  title: string;
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  /**
   * @property {WritableSignal<ProductModalData | null>} modalState
   * Controla la visibilidad y los datos del modal.
   * `null` significa que el modal está cerrado.
   */
  modalState = signal<ProductModalData | null>(null);

  /**
   * Abre el modal con un título y una lista de productos.
   * @param data Los datos a mostrar en el modal.
   */
  open(data: ProductModalData): void {
    document.body.style.overflow = 'hidden'; // Previene el scroll del fondo.
    this.modalState.set(data);
  }

  /** Cierra el modal. */
  close(): void {
    document.body.style.overflow = ''; // Restaura el scroll del fondo.
    this.modalState.set(null);
  }
}
