import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isAdmin$.pipe(
      // Esperamos a que el valor inicial de `false` (mientras se verifica) pase
      skipWhile((isAdmin) => isAdmin === false), // Esto puede necesitar ajuste si tienes lógica compleja
      take(1),
      map((isAdmin) => {
        if (isAdmin) {
          return true; // Es admin, puede pasar.
        } else {
          // Si no es admin después de la verificación, lo mandamos al inicio.
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}
