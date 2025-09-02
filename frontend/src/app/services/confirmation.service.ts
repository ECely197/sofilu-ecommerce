// En: frontend/src/app/services/confirmation.service.ts
import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  // Un Subject para comunicar la decisión del usuario (true si confirma, false si cancela)
  private confirmationResult = new Subject<boolean>();

  // Signal para controlar la visibilidad y configuración del modal
  modalState = signal<ConfirmationConfig | null>(null);

  // El método principal que llamarán otros componentes
  confirm(config: ConfirmationConfig): Promise<boolean> {
    // Mostramos el modal con la configuración proporcionada
    this.modalState.set({
      ...config,
      confirmText: config.confirmText || 'Aceptar',
      cancelText: config.cancelText || 'Cancelar',
    });

    // Devolvemos una nueva Promesa que se resolverá cuando el usuario haga clic en un botón
    return new Promise((resolve) => {
      // Nos suscribimos UNA SOLA VEZ al resultado.
      const subscription = this.confirmationResult.subscribe((result) => {
        resolve(result);
        subscription.unsubscribe(); // Limpiamos la suscripción
      });
    });
  }

  // Métodos para ser llamados desde el componente del modal
  onConfirm(): void {
    this.modalState.set(null); // Ocultamos el modal
    this.confirmationResult.next(true); // Emitimos 'true'
  }

  onCancel(): void {
    this.modalState.set(null); // Ocultamos el modal
    this.confirmationResult.next(false); // Emitimos 'false'
  }
}
