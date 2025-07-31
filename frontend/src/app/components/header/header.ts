import { Component, inject, ChangeDetectorRef, HostBinding, HostListener } from '@angular/core';
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

  // --- LÓGICA NUEVA ---
  // Creamos una propiedad 'isScrolled' para rastrear si el usuario ha hecho scroll.
  private isScrolled = false;

  // 2. @HostBinding: Esta es una herramienta de Angular que nos permite "enlazar" una
  // propiedad de nuestro componente a una propiedad del elemento anfitrión (la etiqueta <app-header>).
  // Aquí, le decimos: "Añade la clase 'scrolled' a la etiqueta <app-header> si la variable 'isScrolled' es true".
  @HostBinding('class.scrolled') get scrolled() {
    return this.isScrolled;
  }

  // 3. @HostListener: Escucha eventos globales. Aquí, le decimos a Angular:
  // "Cada vez que ocurra un evento de 'scroll' en el objeto 'window' (la ventana del navegador),
  // ejecuta este método 'onWindowScroll'".
  @HostListener('window:scroll')
  onWindowScroll() {
    // Obtenemos la posición vertical del scroll.
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Si la posición del scroll es mayor que 10 píxeles, ponemos isScrolled en true.
    // Si no, la ponemos en false.
    this.isScrolled = scrollPosition > 10;
  }
  // --- FIN DE LÓGICA NUEVA ---


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
