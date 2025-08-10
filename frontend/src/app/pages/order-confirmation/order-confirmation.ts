import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss'
})
export class OrderConfirmation implements OnInit { // Implementar OnInit
  private route = inject(ActivatedRoute);

  // Usamos un signal para el ID, es la forma moderna de Angular
  orderId = signal<string | null>(null);

  ngOnInit(): void {
    // Obtenemos el ID de los parámetros de la ruta
    const id = this.route.snapshot.paramMap.get('id');
    this.orderId.set(id);
  }
}
