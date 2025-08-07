import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // La lógica es simple: si 'user' NO es nulo, permite el paso.
        if (user) {
          return true;
        } else {
          // Si es nulo, redirige al login.
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}