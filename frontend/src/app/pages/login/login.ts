/**
 * @fileoverview Componente de la Página de Inicio de Sesión.
 * Proporciona el formulario para que los usuarios existentes se autentiquen
 * y gestiona la lógica de comunicación con el `AuthService`.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { RippleDirective } from '../../directives/ripple'; // Importa la directiva

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RippleDirective, // Añade la directiva para usar `appRipple`
  ],
  templateUrl: './login.html',
  // Reutiliza los estilos de la página de registro para mantener la consistencia visual.
  styleUrl: '../register/register.scss',
  animations: [
    // Animación de entrada para los elementos del formulario.
    trigger('formAnimation', [
      transition(':enter', [
        query('.auth-card > *', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          // `stagger` aplica la animación a cada elemento con un retraso.
          stagger('100ms', [
            animate(
              '500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class Login {
  // --- Inyección de Dependencias ---
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // --- Definición del Formulario Reactivo ---
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  /**
   * Maneja el envío del formulario de inicio de sesión.
   */
  handleSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService
        .login({ email: email!, password: password! })
        .then(() => {
          this.toastService.show('¡Bienvenida de nuevo!');
          this.router.navigate(['/']); // Redirige a la página principal tras el éxito.
        })
        .catch((error) => {
          console.error('Error en el inicio de sesión:', error);
          this.toastService.show('Correo o contraseña incorrectos.', 'error');
        });
    }
  }

  /**
   * Maneja el flujo de inicio de sesión con Google.
   */
  handleGoogleLogin(): void {
    this.authService
      .loginWithGoogle()
      .then(() => {
        this.toastService.show('¡Inicio de sesión exitoso!');
        this.router.navigate(['/']);
      })
      .catch((error) => {
        this.toastService.show('Error al iniciar sesión con Google.', 'error');
        console.error('Error en el inicio de sesión con Google:', error);
      });
  }
}
