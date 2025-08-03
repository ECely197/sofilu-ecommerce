import { Component, inject, ChangeDetectorRef, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { map } from 'rxjs';
import { UiState } from '../../services/ui-state';

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
  public uiStateService = inject(UiState);

  private isScrolled = false;

  @HostBinding('class.scrolled') get scrolled() {
    return this.isScrolled;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    this.isScrolled = scrollPosition > 10;
  }


  logout(): void {
    this.authService.logout()
      .then(() => {
        this.router.navigate(['/']);
        console.log('Sesión cerrada');
      })
      .catch(error => console.error('Error al cerrar sesión:', error));
  }
}
