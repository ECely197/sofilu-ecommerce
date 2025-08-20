import { Injectable, inject } from '@angular/core';
// Importamos todo lo necesario de @angular/fire/auth
import {
  Auth,
  User,
  onAuthStateChanged,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public auth: Auth = inject(Auth);

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  public isAdmin$: Observable<boolean>;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });

    this.isAdmin$ = this.currentUser$.pipe(
      // switchMap nos permite cambiar del observable del usuario a un nuevo observable (el del token)
      switchMap((user) => {
        if (!user) {
          return from([false]);
        }
        // El 'true' FUERZA a que Firebase refresque el token y no use el que está en caché.
        return from(user.getIdTokenResult(true)).pipe(
          map((idTokenResult) => {
            console.log(
              'Admin claim verificado:',
              idTokenResult.claims['admin']
            ); // Log de depuración
            return !!idTokenResult.claims['admin'];
          })
        );
      })
    );
  }

  // --- Métodos de Autenticación ---
  // Estos métodos devuelven Promesas, que es lo que las funciones de Firebase retornan.

  register(credentials: {
    email: string;
    password: any;
  }): Promise<UserCredential> {
    const { email, password } = credentials;
    // Importamos las funciones de Firebase dinámicamente
    return import('@angular/fire/auth').then(
      ({ createUserWithEmailAndPassword }) =>
        createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  login(credentials: {
    email: string;
    password: any;
  }): Promise<UserCredential> {
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

  loginWithGoogle(): Promise<UserCredential> {
    // 'signInWithPopup' abre una ventana emergente de Google para el inicio de sesión.
    // Devuelve una promesa que se resuelve con las credenciales del usuario.
    return import('@angular/fire/auth').then(
      ({ GoogleAuthProvider, signInWithPopup }) =>
        signInWithPopup(this.auth, new GoogleAuthProvider())
    );
  }
}
