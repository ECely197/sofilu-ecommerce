/**
 * @fileoverview Servicio de Autenticación.
 * Centraliza toda la lógica de interacción con Firebase Authentication.
 * Gestiona el estado del usuario actual y expone observables para que
 * otros componentes puedan reaccionar a los cambios de autenticación.
 */
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  onAuthStateChanged,
  UserCredential,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Importación dinámica para las funciones de Firebase Auth
import {
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyección de dependencias moderna de Firebase y Angular.
  public auth: Auth = inject(Auth);

  // BehaviorSubject para mantener y emitir el estado del usuario actual.
  // Es privado para que solo el servicio pueda modificarlo.
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /** Observable público del usuario actual. Los componentes se suscriben a este. */
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  /** Observable que emite `true` si el usuario actual es administrador, `false` en caso contrario. */
  public isAdmin$: Observable<boolean>;

  constructor() {
    // Escucha en tiempo real los cambios en el estado de autenticación de Firebase.
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });

    // Lógica reactiva para determinar el rol de administrador.
    this.isAdmin$ = this.currentUser$.pipe(
      switchMap((user) => {
        // Si no hay usuario, no puede ser admin.
        if (!user) {
          return from([false]);
        }
        // Si hay usuario, se obtiene su token para verificar los 'custom claims'.
        // El `true` fuerza el refresco del token para obtener los claims más recientes.
        return from(user.getIdTokenResult(true)).pipe(
          map((idTokenResult) => !!idTokenResult.claims['admin']) // Convierte el claim a booleano.
        );
      })
    );
  }

  /**
   * Actualiza el perfil de Firebase del usuario logueado (ej. el nombre a mostrar).
   * @param newName El nuevo nombre para el perfil.
   */
  updateUserProfile(newName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      return updateProfile(user, { displayName: newName });
    }
    return Promise.reject(new Error('No hay usuario logueado.'));
  }

  /** Envía un correo de restablecimiento de contraseña al email del usuario actual. */
  sendPasswordResetEmail(): Promise<void> {
    const user = this.auth.currentUser;
    if (user && user.email) {
      return sendPasswordResetEmail(this.auth, user.email);
    }
    return Promise.reject(
      new Error('No se pudo encontrar el email del usuario.')
    );
  }

  // --- Métodos de Autenticación ---

  /**
   * Registra un nuevo usuario con email y contraseña.
   * @param credentials Objeto con email y contraseña.
   */
  register(credentials: {
    email: string;
    password: any;
  }): Promise<UserCredential> {
    const { email, password } = credentials;
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Inicia sesión con email y contraseña.
   * @param credentials Objeto con email y contraseña.
   */
  login(credentials: {
    email: string;
    password: any;
  }): Promise<UserCredential> {
    const { email, password } = credentials;
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Cierra la sesión del usuario actual. */
  logout(): Promise<void> {
    return signOut(this.auth);
  }

  /** Inicia sesión utilizando el proveedor de Google a través de un pop-up. */
  loginWithGoogle(): Promise<UserCredential> {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }
}
