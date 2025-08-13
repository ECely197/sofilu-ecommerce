import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
} from '@angular/router'; // Asegúrate de que RouterLink está importado
import { filter } from 'rxjs';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CartFlyout } from './components/cart-flyout/cart-flyout';

// Importamos AOS y su tipo de opciones
import * as AOS from 'aos';
import { AosOptions } from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Footer, CartFlyout],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  // Usamos el nombre de clase convencional
  private router = inject(Router);

  showGlobalHeaderAndFooter = signal(true);

  ngOnInit() {
    // Lógica para mostrar/ocultar header y footer
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        if (url.includes('/checkout') || url.startsWith('/admin')) {
          this.showGlobalHeaderAndFooter.set(false);
        } else {
          this.showGlobalHeaderAndFooter.set(true);
        }
      });

    const aosConfig: AosOptions = {
      duration: 800,
      easing: 'ease-in-out-cubic',
      once: true,
      offset: 50,
    };

    AOS.init(aosConfig);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        if (url.includes('/checkout') || url.startsWith('/admin')) {
          this.showGlobalHeaderAndFooter.set(false);
        } else {
          this.showGlobalHeaderAndFooter.set(true);
        }
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      });
  }
}
