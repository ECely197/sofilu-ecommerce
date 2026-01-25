import { Component, inject, OnInit, signal } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-work-with-us',
  standalone: true,
  imports: [],
  templateUrl: './work-with-us.html',
  styleUrls: ['./work-with-us.scss'],
})
export class WorkWithUs {
  private settingsService = inject(SettingsService);

  whatsappUrl = signal(''); // Ahora es un signal vacío

  ngOnInit() {
    this.settingsService.getSettings().subscribe((settings) => {
      // Si hay número en la config, úsalo. Si no, usa uno por defecto o cadena vacía.
      const num = settings.whatsappNumber || '573000000000';
      const msg =
        '¡Hola! Estoy interesado/a en vender mis productos en Sofilu.';
      this.whatsappUrl.set(
        `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
      );
    });
  }
}
