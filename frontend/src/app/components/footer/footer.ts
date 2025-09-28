import {
  Component,
  inject,
  OnInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppSettings, SettingsService } from '../../services/settings.service';
import { signal } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink], // Ya no necesitamos NgxParticlesModule
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer implements OnInit {
  private settingsService = inject(SettingsService);
  private el = inject(ElementRef);
  settings = signal<AppSettings | null>(null);

  ngOnInit(): void {
    // La única lógica es cargar los ajustes para los links.
    this.settingsService.getSettings().subscribe((data) => {
      this.settings.set(data);
    });
  }

  // --- ¡NUEVA LÓGICA DE ANIMACIÓN DEL CORAZÓN! ---

  /**
   * Escucha el evento de movimiento del ratón sobre todo el componente footer.
   * @param event El objeto MouseEvent con las coordenadas del cursor.
   */

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

  @HostListener('mouseleave')
  onMouseLeave() {
    // --- LÓGICA SIMPLIFICADA Y CORREGIDA! ---
    const heart = this.el.nativeElement.querySelector('#logo-heart');

    if (heart) {
      gsap.to(heart, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)',
      });
    }
  }
}
