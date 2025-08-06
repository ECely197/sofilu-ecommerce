import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Creamos un grupo de formulario. Cada 'FormControl' representa un input.
  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  // Este método se ejecutará cuando el usuario envíe el formulario.
  handleSubmit() {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      this.authService.register({ email: email!, password: password! })
        .then(response => {
          console.log('¡Registro exitoso!', response);
          // Si el registro es exitoso, lo redirigimos a la página de productos.
          this.router.navigate(['/products']);
        })
        .catch(error => console.error('Error en el registro:', error));
    }
  }

  handleGoogleLogin(): void {
    this.authService.loginWithGoogle()
      .then(response => {
        console.log('¡Inicio de sesión con Google exitoso!', response);
        this.router.navigate(['/']);
      })
      .catch(error => console.error('Error en el inicio de sesión con Google:', error));
  }
}
