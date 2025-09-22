/**
 * =========================================================================
 * DEFINICIÓN DE ANIMACIONES DE RUTA
 * =========================================================================
 * Este archivo utiliza el módulo de Animaciones de Angular para crear
 * transiciones fluidas entre las páginas de la aplicación.
 */

import {
  trigger,
  transition,
  style,
  query,
  animate,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Una transición genérica que se aplica a cualquier cambio de ruta ('* <=> *').
  transition('* <=> *', [
    // 1. Configuración inicial del contenedor y las vistas.
    style({ position: 'relative' }), // El contenedor necesita ser relativo.
    query(
      ':enter, :leave', // Selecciona la vista que entra y la que sale.
      [
        style({
          position: 'absolute', // Ambas vistas se superponen en el mismo espacio.
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true } // Evita errores si no se encuentran las vistas.
    ),

    // 2. Estado inicial de la vista que VA A ENTRAR.
    // Comienza invisible y ligeramente desplazada hacia abajo.
    query(':enter', [style({ opacity: 0, transform: 'translateY(20px)' })], {
      optional: true,
    }),

    // 3. Animación de la vista que SALE.
    // Se desvanece y se desplaza ligeramente hacia arriba.
    query(
      ':leave',
      [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateY(-20px)' })
        ),
      ],
      { optional: true }
    ),

    // 4. Animación de la vista que ENTRA.
    // Aparece y se desplaza a su posición final.
    // Tiene un pequeño retraso (150ms) para empezar después de que la otra vista ha comenzado a salir.
    query(
      ':enter',
      [
        animate(
          '400ms 150ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ],
      { optional: true }
    ),
  ]),
]);
