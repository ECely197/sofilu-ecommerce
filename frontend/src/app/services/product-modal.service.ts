// En: frontend/src/app/services/product-modal.service.ts

import { Injectable, signal } from '@angular/core';
import { Product } from '../interfaces/product.interface';

// Define la información que necesita el modal
export interface ProductModalData {
  title: string;
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  // Un signal para controlar el estado y los datos del modal
  modalState = signal<ProductModalData | null>(null);

  // Método para abrir el modal con un conjunto específico de productos
  open(data: ProductModalData): void {
    document.body.style.overflow = 'hidden'; // Previene el scroll de la página de fondo
    this.modalState.set(data);
  }

  // Método para cerrar el modal
  close(): void {
    document.body.style.overflow = ''; // Restaura el scroll
    this.modalState.set(null);
  }
}
