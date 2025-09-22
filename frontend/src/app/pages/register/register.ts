/**
 * @fileoverview Componente de la Página de Registro.
 * Gestiona el formulario de creación de cuenta de un nuevo usuario,
 * incluyendo la validación y la comunicación con el AuthService.
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
import { RippleDirective } from '../../directives/ripple'; // Importa la directiva para el efecto ripple

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Módulo para formularios reactivos
    RouterLink, // Para los enlaces de navegación como "Inicia Sesión"
    RippleDirective, // Añade la directiva para usar `appRipple`
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  // --- Inyección de Dependencias ---
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService); // Inyecta el servicio de notificaciones

  // --- Definición del Formulario Reactivo ---
  // `FormGroup` agrupa varios `FormControl` para gestionar el estado del formulario completo.
  registerForm = new FormGroup({
    // `FormControl` para el email con validadores: es requerido y debe tener formato de email.
    email: new FormControl('', [Validators.required, Validators.email]),
    // `FormControl` para la contraseña con validadores: es requerida y debe tener al menos 6 caracteres.
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  /**
   * Maneja el envío del formulario de registro.
   * Se ejecuta cuando el usuario hace clic en el botón "Crear Cuenta".
   */
  handleSubmit(): void {
    // Se asegura de que el formulario sea válido antes de intentar el registro.
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      this.authService
        .register({ email: email!, password: password! })
        .then(() => {
          this.toastService.show('¡Cuenta creada con éxito!');
          // Si el registro es exitoso, redirige al usuario a la página principal.
          this.router.navigate(['/']);
        })
        .catch((error) => {
          // Manejo de errores comunes de Firebase
          let errorMessage = 'Ocurrió un error en el registro.';
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está en uso.';
          }
          this.toastService.show(errorMessage, 'error');
          console.error('Error en el registro:', error);
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
