import { Injectable, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, getIdTokenResult, UserCredential } from '@angular/fire/auth';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public auth: Auth = inject(Auth);
  
  // Usaremos un BehaviorSubject para el usuario. Es más robusto para los guardias.
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Observable que nos dirá si el usuario es admin
  public isAdmin$: Observable<boolean>;

  constructor() {
    // Escuchamos los cambios de estado de Firebase
    onAuthStateChanged(this.auth, user => {
      this.currentUserSubject.next(user); // Emitimos el usuario (o null)
    });

    // Creamos un observable derivado para el estado de admin
    this.isAdmin$ = this.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          // Si no hay usuario, no es admin.
          return from([false]);
        }
        // Si hay usuario, forzamos la actualización del token para obtener los claims
        return from(user.getIdTokenResult(true)).pipe(
          map(idTokenResult => {
            // Devolvemos true si el claim 'admin' existe y es verdadero
            return !!idTokenResult.claims['admin'];
          })
        );
      })
    );
  }

  // --- Métodos de Autenticación (devuelven Promesas) ---

  register(credentials: { email: string, password: any }): Promise<UserCredential> {
    const { email, password } = credentials;
    return import('@angular/fire/auth').then(({ createUserWithEmailAndPassword }) => 
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  login(credentials: { email: string, password: any }): Promise<UserCredential> {
    const { email, password } = credentials;
    return import('@angular/fire/auth').then(({ signInWithEmailAndPassword }) => 
      signInWithEmailAndPassword(this.auth, email, password)
    );
  }

  logout(): Promise<void> {
    return import('@angular/fire/auth').then(({ signOut }) => 
      signOut(this.auth)
    );
  }
}