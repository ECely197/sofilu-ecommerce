/**
 * @fileoverview Componente de la Página de Registro.
 * Gestiona el formulario de creación de cuenta de un nuevo usuario,
 * incluyendo la validación y la comunicación con el AuthService.
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { RippleDirective } from '../../directives/ripple';

function passwordsMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RippleDirective],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // --- Signals para el "ojito" de la contraseña ---
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  registerForm = new FormGroup(
    {
      displayName: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      acceptsMarketing: new FormControl(false),
      agreedToTerms: new FormControl(false, [Validators.requiredTrue]),
    },
    { validators: passwordsMatchValidator }
  );

  handleSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }

    const { displayName, email, password, acceptsMarketing, agreedToTerms } =
      this.registerForm.value;

    this.authService
      .register({ email: email!, password: password! })
      .then((userCredential) => {
        return this.authService.updateUserProfile(displayName!);
      })
      .then(() => {
        console.log('Guardar en MongoDB:', { acceptsMarketing, agreedToTerms });

        this.toastService.show('¡Cuenta creada con éxito!');
        this.router.navigate(['/']);
      })
      .catch((error) => {
        let errorMessage = 'Ocurrió un error en el registro.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este correo electrónico ya está en uso.';
        }
        this.toastService.show(errorMessage, 'error');
        console.error('Error en el registro:', error);
      });
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
