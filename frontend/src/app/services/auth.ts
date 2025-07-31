import { Injectable, inject, signal } from '@angular/core';
import { Auth, User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);

   currentUser = signal<User | null | undefined>(undefined);

  constructor() {  onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // Si Firebase nos da un 'user', significa que alguien ha iniciado sesión.
        // Actualizamos nuestro signal con la información del usuario.
        this.currentUser.set(user);
      } else {
        // Si Firebase nos da 'null', significa que nadie ha iniciado sesión.
        // Actualizamos nuestro signal a null.
        this.currentUser.set(null);
      }
      console.log('Estado de autenticación cambiado, usuario actual:', this.currentUser());
    });}

  // Método para registrar un nuevo usuario
  register({ email, password }: any) {
    // Usamos la función de Firebase para crear un usuario
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Método para iniciar sesión
  login({ email, password }: any) {
    // Usamos la función de Firebase para iniciar sesión
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Método para cerrar sesión
  logout() {
    return signOut(this.auth);
  }
}
