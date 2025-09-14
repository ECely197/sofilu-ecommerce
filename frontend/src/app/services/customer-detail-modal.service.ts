// En: frontend/src/app/services/customer-detail-modal.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CustomerDetailModalService {
  // El signal contendrá el UID del cliente que queremos ver, o null si está cerrado
  activeCustomerId = signal<string | null>(null);

  // Método para abrir el modal para un cliente específico
  open(uid: string): void {
    document.body.style.overflow = 'hidden';
    this.activeCustomerId.set(uid);
  }

  // Método para cerrar el modal
  close(): void {
    document.body.style.overflow = '';
    this.activeCustomerId.set(null);
  }
}
