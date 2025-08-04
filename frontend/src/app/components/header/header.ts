import { Component, inject, HostBinding, HostListener, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { UiState } from '../../services/ui-state';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  // ¡Asegúrate de que RouterLinkActive también está aquí!
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html', // Usando tu convención de nombres
  styleUrl: './header.scss',   // Usando tu convención de nombres
  animations: [
    trigger('flyInOut', [
      transition(':enter', [
        style({ transform: 'scale(0.95) translateY(-10px)', opacity: 0 }),
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', 
                style({ transform: 'scale(0.95) translateY(-10px)', opacity: 0 }))
      ])
    ])
  ]
})
export class Header {
  public uiStateService = inject(UiState);
  public cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public currentUser$: Observable<User | null> = this.authService.currentUser$;
  public isAdmin$: Observable<boolean> = this.authService.isAdmin$;

  public isProfileMenuOpen = false;

  private cdr = inject(ChangeDetectorRef);

  private isScrolled = false;

  @HostBinding('class.scrolled') get scrolled() {
    return this.isScrolled;
  }

   @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Guardamos el estado anterior para ver si ha cambiado
    const wasScrolled = this.isScrolled;

    // Actualizamos el nuevo estado
    this.isScrolled = scrollPosition > 10;
    
    // ¡EL PASO CLAVE!
    // Si el estado ha cambiado (de no-scrolled a scrolled, o viceversa),
    // forzamos a Angular a que lo detecte y actualice el HostBinding.
    if (wasScrolled !== this.isScrolled) {
      this.cdr.detectChanges();
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
  
  logout(): void {
    this.isProfileMenuOpen = false;
    this.authService.logout()
      .then(() => this.router.navigate(['/']))
      .catch(error => console.error('Error al cerrar sesión:', error));
  }
}