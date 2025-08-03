import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take } from 'rxjs/operators';
import { user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // El onAuthStateChanged nos da un observable del estado del usuario
  return user(authService.auth).pipe(
    take(1), // Tomamos solo el primer valor para decidir
    map(user => {
      if (user) {
        // Si hay un usuario, le permitimos el paso
        return true;
      } else {
        // Si no hay usuario, lo redirigimos a la página de login
        // y bloqueamos la navegación.
        console.log('Acceso denegado - Usuario no autenticado');
        router.navigate(['/login']);
        return false;
      }
    })
  );
};