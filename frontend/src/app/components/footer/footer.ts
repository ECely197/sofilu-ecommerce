import {
  Component,
  inject,
  OnInit,
  HostListener,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppSettings, SettingsService } from '../../services/settings.service';
import { signal } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer implements OnInit {
  private settingsService = inject(SettingsService);
  private el = inject(ElementRef);
  settings = signal<AppSettings | null>(null);

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((data) => {
      this.settings.set(data);
    });
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const logoContainer =
      this.el.nativeElement.querySelector('.footer-brand-logo');
    const heart = this.el.nativeElement.querySelector('#logo-heart');

    if (!logoContainer || !heart) return;

    const rect = logoContainer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(heart, {
      x: x * 3,
      y: y * 3,
      duration: 0.5,
      ease: 'power2.out',
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Calculamos si estamos cerca del final de la página
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const footerHeight = this.el.nativeElement.offsetHeight || 800;

    // Si ya estamos viendo gran parte del footer...
    if (scrollPosition > documentHeight - (footerHeight / 2)) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }
  }

  ngOnDestroy() {
    // Limpieza por si acaso
    document.body.classList.remove('hide-header');
  }
}
