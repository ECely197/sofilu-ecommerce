import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../register/register.scss'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Creamos un grupo de formulario para el login.
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  // Este método se ejecuta al enviar el formulario.
  handleSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login({ email: email!, password: password! })
        .then(response => {
          console.log('¡Inicio de sesión exitoso!', response);
          // Si el login es exitoso, lo redirigimos a la página de inicio.
          this.router.navigate(['/']);
        })
        .catch(error => {
          // En un futuro, aquí mostraríamos un mensaje de error al usuario.
          console.error('Error en el inicio de sesión:', error);
          alert('Correo o contraseña incorrectos.');
        });
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
