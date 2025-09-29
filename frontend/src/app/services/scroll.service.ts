// En: frontend/src/app/services/scroll.service.ts
import { Injectable, NgZone } from '@angular/core';
import Lenis from '@studio-freight/lenis';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private lenis: Lenis | null = null;

  constructor(private zone: NgZone) {}

  init() {
    // Solo inicializamos si estamos en el navegador (no en el servidor)
    if (typeof window !== 'undefined') {
      this.zone.runOutsideAngular(() => {
        this.lenis = new Lenis();

        const raf = (time: number) => {
          this.lenis?.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      });
    }
  }

  destroy() {
    this.lenis?.destroy();
    this.lenis = null;
  }
}
