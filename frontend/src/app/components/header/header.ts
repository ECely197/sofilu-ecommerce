import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
// Asegúrate de que UiStateService está importado
import { UiState } from '../../services/ui-state'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);
  public cartService = inject(CartService);
  // Asegúrate de inyectar y hacer público el UiStateService
  public uiStateService = inject(UiState);

  // Exponemos los observables del servicio al template
  currentUser$: Observable<User | null> = this.authService.currentUser$;
  isAdmin$: Observable<boolean> = this.authService.isAdmin$;
  
  logout(): void {
    this.authService.logout()
      .then(() => this.router.navigate(['/']))
      .catch(error => console.error('Error al cerrar sesión:', error));
  }
}