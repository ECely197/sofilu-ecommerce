import { Component, Input, inject, ElementRef, HostListener } from '@angular/core';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input() product!: Product;

  private el = inject(ElementRef);

  // --- LÓGICA NUEVA PARA LA INCLINACIÓN ---
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const card = this.el.nativeElement.querySelector('.card');
    const { clientX, clientY } = event;
    const { left, top, width, height } = card.getBoundingClientRect();
    
    // Calculamos la posición del ratón desde el centro de la tarjeta (-0.5 a 0.5)
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    
    // Invertimos 'y' para que la rotación sea natural
    // Multiplicamos por un factor (ej: 20) para controlar la intensidad de la inclinación
    const rotateY = x * 20;
    const rotateX = -y * 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    // Cuando el ratón sale, reseteamos la tarjeta a su estado original
    const card = this.el.nativeElement.querySelector('.card');
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  }
}
