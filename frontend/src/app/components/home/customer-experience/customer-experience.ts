import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

Swiper.use([Autoplay]);

@Component({
  selector: 'app-customer-experience',
  standalone: true,
  imports: [],
  templateUrl: './customer-experience.html',
  styleUrls: ['./customer-experience.scss'],
})
export class CustomerExperience implements AfterViewInit {
  private el = inject(ElementRef);

  // Datos de ejemplo. En el futuro, podrían venir de una API.
  experiences = [
    {
      type: 'image',
      url: '/assets/customer/experience-1.jpg',
      caption: '¡Le encantó su regalo! Gracias Sofilu.',
    },
    {
      type: 'video',
      url: '/assets/customer/experience-video.mp4',
      caption: 'La mejor sorpresa de cumpleaños.',
    },
    {
      type: 'image',
      url: '/assets/customer/experience-2.jpg',
      caption: 'Calidad y ternura en un solo paquete.',
    },
    {
      type: 'image',
      url: '/assets/customer/experience-3.jpg',
      caption: 'Mi nuevo compañero de escritorio.',
    },
  ];

  ngAfterViewInit(): void {
    new Swiper(this.el.nativeElement.querySelector('.swiper'), {
      slidesPerView: 'auto',
      spaceBetween: 30,
      centeredSlides: true,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
    });
  }
}
