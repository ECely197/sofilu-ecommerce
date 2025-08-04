import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root' // Lo hacemos un servicio inyectable
})
export class AuthGuard implements CanActivate {

  // Ahora inyectamos las dependencias en el constructor, el contexto "seguro"
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // El método 'canActivate' es el que el enrutador ejecutará
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    return this.authService.isAdmin$.pipe(
      take(1),
      map(isAdmin => {
        if (isAdmin) {
          return true; // Puede pasar
        } else {
          // Si no es admin, redirigimos y bloqueamos
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}