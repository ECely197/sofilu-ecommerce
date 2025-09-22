/**
 * @fileoverview Servicio de Notificaciones (Toasts).
 * Proporciona una forma centralizada de mostrar notificaciones emergentes
 * (conocidas como "toasts") en cualquier parte de la aplicación.
 */
import { Injectable, signal } from '@angular/core';

/** Interfaz que define la estructura de una notificación toast. */
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  duration?: number; // Duración opcional en milisegundos
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /**
   * @property {WritableSignal<Toast[]>} toasts
   * Un signal que mantiene un array de las notificaciones actualmente visibles.
   * El `ToastContainerComponent` se suscribirá a los cambios de este signal.
   */
  toasts = signal<Toast[]>([]);
  private idCounter = 0; // Para asignar un ID único a cada toast

  /**
   * Muestra una nueva notificación.
   * @param message El mensaje a mostrar.
   * @param type El tipo de notificación ('success' o 'error').
   * @param duration El tiempo en milisegundos que la notificación será visible.
   */
  show(
    message: string,
    type: 'success' | 'error' = 'success',
    duration = 4000
  ): void {
    const newToast: Toast = {
      id: this.idCounter++,
      message,
      type,
      duration,
    };

    // `update` modifica el valor del signal basándose en su estado actual.
    // Añade el nuevo toast a la lista de toasts existentes.
    this.toasts.update((currentToasts) => [...currentToasts, newToast]);

    // Establece un temporizador para eliminar automáticamente el toast después de su duración.
    setTimeout(() => this.remove(newToast.id), duration);
  }

  /**
   * Elimina una notificación de la lista de toasts visibles.
   * @param id El ID de la notificación a eliminar.
   * @private
   */
  remove(id: number): void {
    this.toasts.update((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }
}
