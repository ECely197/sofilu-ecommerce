import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appRipple]',
  standalone: true
})
export class RippleDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const hostElement = this.el.nativeElement;

    // Limpiamos cualquier onda anterior para evitar acumulaciones
    const existingRipple = hostElement.querySelector('.ripple-effect');
    if (existingRipple) {
      this.renderer.removeChild(hostElement, existingRipple);
    }

    const circle = this.renderer.createElement('span');
    const diameter = Math.max(hostElement.clientWidth, hostElement.clientHeight);
    const radius = diameter / 2;
    
    // --- CÁLCULO MEJORADO ---
    // Obtenemos la posición del elemento anfitrión en la página
    const hostRect = hostElement.getBoundingClientRect();
    // Calculamos la posición del clic RELATIVA al elemento
    const left = event.clientX - hostRect.left - radius;
    const top = event.clientY - hostRect.top - radius;

    // Aplicamos los estilos
    this.renderer.setStyle(circle, 'width', `${diameter}px`);
    this.renderer.setStyle(circle, 'height', `${diameter}px`);
    this.renderer.setStyle(circle, 'left', `${left}px`);
    this.renderer.setStyle(circle, 'top', `${top}px`);
    this.renderer.addClass(circle, 'ripple-effect');

    this.renderer.appendChild(hostElement, circle);

    setTimeout(() => {
      // A veces el círculo no se elimina si se hace clic muy rápido,
      // esta comprobación lo hace más robusto.
      if (circle.parentNode) {
        this.renderer.removeChild(hostElement, circle);
      }
    }, 600);
  }
}