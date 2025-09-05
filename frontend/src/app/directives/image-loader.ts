import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[appImageLoader]',
  standalone: true,
})
export class ImageLoaderDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('load')
  onLoad() {
    // Cuando la imagen termina de cargar, añade la clase 'loaded' a su contenedor padre
    this.renderer.addClass(this.el.nativeElement.parentElement, 'loaded');
  }
}
