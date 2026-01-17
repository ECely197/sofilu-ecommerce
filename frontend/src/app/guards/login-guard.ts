import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators'; // ¡Importamos skipWhile!
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      // --- LA CORRECCIÓN MÁGICA ---
      // 1. skipWhile: Ignora todos los valores iniciales mientras sean `undefined` o `null`.
      //    El BehaviorSubject empieza con `null`, así que lo ignora y ESPERA.
      skipWhile((user) => user === null),

      // 2. take(1): Una vez que llega el primer valor que NO es `null` (el usuario real o
      //    la confirmación de que no hay nadie), lo toma y se desuscribe.
      take(1),

      map((user) => {
        // Ahora, 'user' será el objeto de usuario real o `undefined/null` si de verdad no hay sesión.
        if (user) {
          return true; // Hay usuario, puede pasar.
        } else {
          this.router.navigate(['/login']); // No hay usuario, redirigir.
          return false;
        }
      })
    );
  }
}
