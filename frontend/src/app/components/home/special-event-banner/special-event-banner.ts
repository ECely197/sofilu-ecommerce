import { Component, Input, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common'; // <-- Añade ViewportScroller
import { Router } from '@angular/router'; // <-- Añade Router
import { SpecialEvent } from '../../../services/special-event.service';
import { RippleDirective } from '../../../directives/ripple';
import { gsap } from 'gsap'; // <-- ¡NUEVO! Para la animación de resaltado

@Component({
  selector: 'app-special-event-banner',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './special-event-banner.html',
  styleUrls: ['./special-event-banner.scss'],
})
export class SpecialEventBanner {
  @Input() event: SpecialEvent | null = null;

  // --- Inyección de Dependencias ---
  private viewportScroller = inject(ViewportScroller);
  private router = inject(Router);

  /**
   * ¡LÓGICA MEJORADA!
   * Inicia el scroll suave hacia la sección de la categoría vinculada.
   */
  scrollToProducts(): void {
    if (!this.event || this.event.linkedProducts.length === 0) {
      return;
    }

    // Asumimos que todos los productos vinculados pertenecen a la misma categoría.
    // Obtenemos el `slug` de la categoría del primer producto.
    const category = this.event.linkedProducts[0].category as any;
    const categorySlug = category?.slug;

    if (!categorySlug) {
      console.error(
        'La categoría de los productos vinculados no tiene un slug.'
      );
      return;
    }

    // --- Lógica de Scroll (replicada del Header) ---
    if (this.router.url === '/') {
      // Si ya estamos en la home, hacemos el scroll.
      this.scrollToCategory(categorySlug);
    } else {
      // Si estamos en otra página, navegamos a la home y LUEGO hacemos scroll.
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToCategory(categorySlug), 100);
      });
    }
  }

  /**
   * ¡NUEVO! Lógica de scroll y resaltado (replicada del Header).
   */
  private scrollToCategory(elementId: string): void {
    this.viewportScroller.scrollToAnchor(elementId);

    const element = document.getElementById(elementId);
    if (element) {
      gsap.fromTo(
        element,
        { boxShadow: '0 0 0 0px rgba(244, 194, 194, 0.7)' },
        {
          boxShadow: '0 0 0 5px rgba(244, 194, 194, 0.7)',
          repeat: 1,
          yoyo: true,
          duration: 0.5,
          ease: 'power2.inOut',
        }
      );
    }
  }
}
