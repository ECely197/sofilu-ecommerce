import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log(
      '--- AuthGuard: Se ha activado el guardia de la ruta /admin ---'
    ); // LOG 1
    return this.authService.isAdmin$.pipe(
      take(1),
      map((isAdmin) => {
        if (isAdmin) {
          console.log(
            '--- AuthGuard: Acceso PERMITIDO (el usuario es admin) ---'
          ); // LOG 2 (Éxito)
          return true; // Puede pasar
        } else {
          console.log(
            '--- AuthGuard: Acceso DENEGADO (el usuario no es admin o no está logueado) ---'
          );
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}
