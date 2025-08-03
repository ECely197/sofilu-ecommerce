import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CartFlyout } from './components/cart-flyout/cart-flyout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    Header, 
    Footer,
    CartFlyout
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  
  // Signal para controlar la visibilidad del header/footer
  showGlobalHeaderAndFooter = signal(true);

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      // Oculta el header/footer en las rutas de checkout y admin
      if (url.includes('/checkout') || url.startsWith('/admin')) {
        this.showGlobalHeaderAndFooter.set(false);
      } else {
        this.showGlobalHeaderAndFooter.set(true);
      }
    });
  }
}