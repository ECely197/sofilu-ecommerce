// En: frontend/src/app/route-animations.ts
import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Definimos una transición genérica que se aplica a cualquier cambio de ruta
  transition('* <=> *', [
    // Estilos iniciales para ambas páginas (la que entra y la que sale)
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true }
    ),

    // Estilo inicial para la página que VA A ENTRAR
    query(':enter', [style({ opacity: 0, transform: 'translateY(20px)' })], {
      optional: true,
    }),

    // Animamos la página que SALE
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

    // Animamos la página que ENTRA
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
