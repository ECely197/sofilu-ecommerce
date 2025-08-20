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
// Importamos las herramientas de rxjs que necesitamos
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Hacemos pública la instancia de Auth para que el guardia pueda acceder a ella
  public auth: Auth = inject(Auth);

  // Usamos un BehaviorSubject para emitir el estado del usuario actual.
  // Empieza como 'null', indicando que al principio no hay usuario logueado.
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Exponemos el estado del usuario como un Observable público
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  // Creamos un Observable derivado que nos dirá si el usuario actual es admin
  public isAdmin$: Observable<boolean>;

  constructor() {
    // onAuthStateChanged es el "escuchador" de Firebase.
    // Se activa al cargar la app, al hacer login y al hacer logout.
    onAuthStateChanged(this.auth, (user) => {
      // Cada vez que el estado cambia, emitimos el nuevo valor (ya sea el objeto User o null)
      this.currentUserSubject.next(user);
    });

    // Definimos la lógica del observable isAdmin$
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
