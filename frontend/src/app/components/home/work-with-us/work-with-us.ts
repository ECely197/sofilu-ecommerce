import { Component } from '@angular/core';

@Component({
  selector: 'app-work-with-us',
  standalone: true,
  imports: [],
  templateUrl: './work-with-us.html',
  styleUrls: ['./work-with-us.scss'],
})
export class WorkWithUs {
  // Define tu número de WhatsApp y un mensaje predeterminado
  whatsappNumber = '573001234567'; // Reemplaza con tu número en formato internacional
  whatsappMessage =
    '¡Hola! Estoy interesado/a en vender mis productos en Sofilu.';

  get whatsappUrl(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(
      this.whatsappMessage
    )}`;
  }
}
