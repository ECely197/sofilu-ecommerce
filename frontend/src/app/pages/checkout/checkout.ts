import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { Router } from '@angular/router';


@Component({
  selector: 'app-checkout',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout {
  public cartService = inject(CartService);
  private router = inject(Router);


  handlePayment(): void {
    console.log('Procesando pago...');
    setTimeout(() => {
      console.log('¡Pago exitoso!');
      
      this.cartService.clearCart();

      this.router.navigate(['/order-confirmation']);
    }, 1500);
  }
}
