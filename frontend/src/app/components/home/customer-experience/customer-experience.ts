import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, EffectCoverflow } from 'swiper/modules'; // Importamos EffectCoverflow

Swiper.use([Autoplay, EffectCoverflow]);

@Component({
  selector: 'app-customer-experience',
  standalone: true,
  imports: [],
  templateUrl: './customer-experience.html',
  styleUrls: ['./customer-experience.scss'],
})
export class CustomerExperience implements AfterViewInit {
  private el = inject(ElementRef);

  experiences = [
    { type: 'image', url: 'assets/customer/experience-1.jpg', caption: '¡Le encantó su regalo! Gracias Sofilu.' },
    { type: 'video', url: 'assets/customer/experience-video.mp4', caption: 'La mejor sorpresa de cumpleaños.' },
    { type: 'image', url: 'assets/customer/experience-2.jpg', caption: 'Calidad y ternura en un solo paquete.' },
    { type: 'image', url: 'assets/customer/experience-3.jpg', caption: 'Mi nuevo compañero de escritorio.' },
    { type: 'image', url: 'assets/customer/experience-1.jpg', caption: 'Repetiré seguro. ¡Envío rapidísimo!' }, // Duplicado para demo
  ];

  ngAfterViewInit(): void {
    new Swiper(this.el.nativeElement.querySelector('.swiper'), {
      effect: 'coverflow', // Activamos el efecto 3D
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true // Pausa si el usuario quiere leer
      },
      coverflowEffect: {
        rotate: 0,      // Sin rotación extraña
        stretch: 0,
        depth: 100,     // Profundidad (qué tan lejos se ven los de atrás)
        modifier: 2.5,  // Intensidad del efecto
        slideShadows: false, // Usamos nuestras propias sombras CSS
      },
    });
  }
}