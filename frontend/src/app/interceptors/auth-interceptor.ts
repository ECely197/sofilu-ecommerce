import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth: Auth = inject(Auth);
  
  // Obtenemos el usuario actual de Firebase
  const user = auth.currentUser;
  
  if (user) {
    // Si hay un usuario, pedimos su token. Esto devuelve una promesa.
    return from(user.getIdToken()).pipe(
      switchMap(token => {
        // Cuando obtenemos el token, clonamos la petición original
        // y le añadimos la nueva cabecera 'Authorization'.
        const clonedReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        // Dejamos que la petición clonada (y ahora autorizada) continúe su camino.
        return next(clonedReq);
      })
    );
  } else {
    // Si no hay usuario, dejamos que la petición continúe sin token.
    return next(req);
  }
};