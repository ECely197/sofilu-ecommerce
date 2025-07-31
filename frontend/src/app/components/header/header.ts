import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { map } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  public CartService = inject(CartService);
  public authService = inject(AuthService);
  private router = inject(Router);

  // --- MÉTODO NUEVO ---
  logout(): void {
    this.authService.logout()
      .then(() => {
        // Cuando el logout es exitoso, redirigimos a la página de inicio.
        this.router.navigate(['/']);
        console.log('Sesión cerrada');
      })
      .catch(error => console.error('Error al cerrar sesión:', error));
  }
}
