import {
  Component,
  Input,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';
import { SpecialEvent } from '../../../services/special-event.service';
import { RippleDirective } from '../../../directives/ripple';

// Importaciones de GSAP
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-special-event-banner',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './special-event-banner.html',
  styleUrls: ['./special-event-banner.scss'],
})
export class SpecialEventBanner implements AfterViewInit {
  @Input() event: SpecialEvent | null = null;

  // Referencias a los elementos del HTML
  @ViewChild('bannerContainer') bannerContainer!: ElementRef<HTMLElement>;
  @ViewChild('bannerImage') bannerImage!: ElementRef<HTMLImageElement>;
  @ViewChild('eventTitle') eventTitle!: ElementRef<HTMLHeadingElement>;
  @ViewChild('eventSubtitle') eventSubtitle!: ElementRef<HTMLParagraphElement>;
  @ViewChild('ctaButton') ctaButton!: ElementRef<HTMLDivElement>;

  private viewportScroller = inject(ViewportScroller);
  private router = inject(Router);
  private zone = inject(NgZone);

  // --- NUEVO: Animación de Entrada ---
  ngAfterViewInit(): void {
    // Usamos NgZone para correr GSAP fuera del ciclo de Angular (mejor rendimiento)
    this.zone.runOutsideAngular(() => {
      this.initIntroAnimation();
    });
  }

  private initIntroAnimation(): void {
    // 1. Ocultar todo al principio para prepararlo
    gsap.set(
      [
        this.eventTitle.nativeElement,
        this.eventSubtitle?.nativeElement,
        this.ctaButton?.nativeElement,
      ],
      {
        opacity: 0,
        y: 30, // Moverlos 30px abajo
      }
    );

    // 2. Usar SplitText para animar el título letra por letra
    const split = new SplitText(this.eventTitle.nativeElement, {
      type: 'chars',
    });
    gsap.set(split.chars, { opacity: 0, y: 50 }); // Letras ocultas y abajo

    // 3. Crear una LÍNEA DE TIEMPO para la secuencia de animación
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 1 },
    });

    tl
      // Animación de la imagen de fondo (Zoom out)
      .from(
        this.bannerImage.nativeElement,
        {
          scale: 1.1,
          duration: 2,
          ease: 'power2.out',
        },
        0
      ) // El '0' significa "al inicio de la línea de tiempo"

      // Animación del título (letra por letra)
      .to(
        split.chars,
        {
          opacity: 1,
          y: 0,
          stagger: 0.04, // Retraso entre cada letra
          duration: 0.8,
        },
        '-=1.5'
      ) // Empieza 1.5s antes de que termine la animación anterior

      // Animación del subtítulo (si existe)
      .to(
        this.eventSubtitle?.nativeElement,
        {
          opacity: 1,
          y: 0,
        },
        '-=0.8'
      )

      // Animación del botón
      .to(
        this.ctaButton?.nativeElement,
        {
          opacity: 1,
          y: 0,
        },
        '-=0.6'
      );
  }

  // --- Lógica de Scroll (ya la tenías, se mantiene igual) ---
  scrollToProducts(): void {
    if (!this.event || this.event.linkedProducts.length === 0) return;
    const category = this.event.linkedProducts[0].category as any;
    if (!category?.slug) return;

    if (this.router.url === '/') {
      this.scrollToCategory(category.slug);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToCategory(category.slug), 100);
      });
    }
  }

  /**
   * ¡NUEVO! Lógica de scroll y resaltado (replicada del Header).
   */
  private scrollToCategory(elementId: string): void {
    const element = document.getElementById(elementId);
    const sectionElement = document.getElementById(elementId);
    const cardElement = sectionElement?.querySelector('.card');
    if (element && cardElement) {
      // Usamos el método nativo `scrollIntoView` que nos da la opción 'smooth'.
      element.scrollIntoView({
        behavior: 'smooth', // ¡ESTA ES LA CLAVE PARA EL SCROLL SUAVE!
        block: 'start', // Alinea la parte superior del elemento con la parte superior de la ventana.
        inline: 'nearest',
      });

      gsap.fromTo(
        cardElement,
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
