// En: frontend/src/app/services/toast.service.ts

import { Injectable, signal } from '@angular/core';

// Definimos la estructura de una notificación
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error'; // Tipo de notificación
  duration?: number; // Duración en milisegundos
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // Un signal que contendrá el array de notificaciones activas
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  // Método para mostrar una notificación
  show(
    message: string,
    type: 'success' | 'error' = 'success',
    duration = 4000
  ) {
    const newToast: Toast = {
      id: this.idCounter++,
      message,
      type,
      duration,
    };

    // Añadimos la nueva notificación al array
    this.toasts.update((currentToasts) => [...currentToasts, newToast]);

    // Programamos su eliminación después de la duración especificada
    setTimeout(() => this.remove(newToast.id), duration);
  }

  // Método para eliminar una notificación (usado internamente)
  remove(id: number) {
    this.toasts.update((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }
}
