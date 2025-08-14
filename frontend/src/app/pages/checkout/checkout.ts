import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        query('.form-section', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate(
              '500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class checkout implements OnInit {
  public cartService = inject(CartService);
  private router = inject(Router);
  private orderService = inject(OrderService);

  checkoutForm!: FormGroup;

  ngOnInit(): void {
    this.checkoutForm = new FormGroup({
      contactInfo: new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
      }),
      shippingAddress: new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
        postalCode: new FormControl(''),
        phone: new FormControl('', Validators.required),
      }),
    });
  }

  handlePayment(): void {
    if (this.cartService.totalItems() === 0) {
      alert('Tu carrito está vacío. Añade productos antes de continuar.');
      this.router.navigate(['/products']);
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const customerInfo = {
      name: formValue.shippingAddress.name,
      email: formValue.contactInfo.email,
    };

    const cartItems = this.cartService.cartItems();

    const processedItems = cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      selectedVariants: item.selectedVariants, // Incluimos las variantes
    }));

    const orderData = {
      customerInfo,
      items: processedItems,
    };

    // --- LOG DE DEPURACIÓN CLAVE ---
    console.log('--- ENVIANDO DATOS DEL PEDIDO AL BACKEND ---');
    console.log(JSON.stringify(orderData, null, 2));

    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        console.log('¡Pedido creado con éxito!', savedOrder);
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation', savedOrder._id]);
      },
      error: (err) => {
        console.error('Error al crear el pedido:', err);
        // Mostramos un mensaje más útil en caso de error
        const errorMessage =
          err.error?.message || 'Hubo un error al procesar tu pedido.';
        alert(errorMessage + ' Revisa la consola para más detalles.');
      },
    });
  }

  public objectKeys(obj: object): string[] {
    if (!obj) {
      return [];
    }
    return Object.keys(obj);
  }
}
