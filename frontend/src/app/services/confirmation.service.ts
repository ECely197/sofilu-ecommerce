/**
 * @fileoverview Servicio de Confirmación.
 * Proporciona una forma programática y reutilizable de mostrar un modal
 * de confirmación (ej: "¿Estás seguro de que quieres eliminar esto?")
 * y obtener la respuesta del usuario a través de una Promesa.
 */
import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

/** Interfaz para la configuración del modal de confirmación. */
export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string; // Texto del botón de confirmar
  cancelText?: string; // Texto del botón de cancelar
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  // `Subject` es un tipo de Observable que permite emitir valores.
  // Se usa aquí para comunicar la decisión del usuario desde el modal al servicio.
  private confirmationResult = new Subject<boolean>();

  /**
   * @property {WritableSignal<ConfirmationConfig | null>} modalState
   * Un signal que controla la visibilidad y el contenido del modal.
   * Si es `null`, el modal está oculto. Si tiene un objeto `ConfirmationConfig`, está visible.
   */
  modalState = signal<ConfirmationConfig | null>(null);

  /**
   * Abre el modal de confirmación y devuelve una Promesa que se resuelve
   * con `true` si el usuario confirma, o `false` si cancela.
   * @param config La configuración de título, mensaje y textos de botones.
   */
  confirm(config: ConfirmationConfig): Promise<boolean> {
    // Muestra el modal actualizando el signal con la configuración.
    this.modalState.set({
      ...config,
      confirmText: config.confirmText || 'Aceptar',
      cancelText: config.cancelText || 'Cancelar',
    });

    // Devuelve una Promesa para que el componente que llama pueda esperar la respuesta.
    return new Promise((resolve) => {
      // Se suscribe UNA SOLA VEZ para escuchar la respuesta del usuario.
      const subscription = this.confirmationResult.subscribe((result) => {
        resolve(result);
        subscription.unsubscribe(); // Limpia la suscripción para evitar fugas de memoria.
      });
    });
  }

  /** Método llamado por el `ConfirmationModalComponent` cuando el usuario hace clic en "Confirmar". */
  onConfirm(): void {
    this.modalState.set(null); // Oculta el modal.
    this.confirmationResult.next(true); // Emite `true` para resolver la Promesa.
  }

  /** Método llamado por el `ConfirmationModalComponent` cuando el usuario hace clic en "Cancelar". */
  onCancel(): void {
    this.modalState.set(null); // Oculta el modal.
    this.confirmationResult.next(false); // Emite `false` para resolver la Promesa.
  }
}
