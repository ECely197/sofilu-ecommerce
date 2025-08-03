// Importaciones necesarias
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { RippleDirective } from '../../directives/ripple';

// ¡El decorador @Component es fundamental!
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './checkout.html', // Usando tu convención de nombres
  styleUrl: './checkout.scss'     // Usando tu convención de nombres
})
// ¡Nombre de clase corregido y OnInit implementado!
export class checkout implements OnInit {
  // Inyección de dependencias
  public cartService = inject(CartService);
  private router = inject(Router);
  private orderService = inject(OrderService);

  // Declaración del formulario
  checkoutForm!: FormGroup;

  ngOnInit(): void {
    // Inicializamos el formulario en ngOnInit
    this.checkoutForm = new FormGroup({
      contactInfo: new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email])
      }),
      shippingAddress: new FormGroup({
        name: new FormControl('', Validators.required),
        address: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
        postalCode: new FormControl(''), // Opcional por ahora
        phone: new FormControl('', Validators.required)
      })
    });
  }

  handlePayment(): void {
    // Primero, verificamos si el carrito está vacío.
    if (this.cartService.totalItems() === 0) {
      alert("Tu carrito está vacío. Añade productos antes de continuar.");
      this.router.navigate(['/products']);
      return; // Detiene la ejecución si el carrito está vacío
    }
    
    // Marcamos todos los campos como "tocados" para que se muestren los errores de validación.
    this.checkoutForm.markAllAsTouched();

    // Segundo, verificamos si el formulario es válido.
    if (this.checkoutForm.invalid) {
      alert('Por favor, completa todos los campos requeridos.');
      return; // Detiene la ejecución si el formulario no es válido
    }

    // Si todo es válido, procedemos a crear el pedido.
    const formValue = this.checkoutForm.getRawValue();
    const customerInfo = {
      name: formValue.shippingAddress.name,
      email: formValue.contactInfo.email,
      // Aquí añadiríamos el resto de los datos de envío en el futuro
    };

    const cartItems = this.cartService.cartItems();
    const processedItems = cartItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    const orderData = {
      customerInfo,
      items: processedItems
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (savedOrder) => {
        console.log('¡Pedido creado con éxito!', savedOrder);
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation']);
      },
      error: (err) => {
        console.error('Error al crear el pedido:', err);
        alert('Hubo un error al procesar tu pedido. Revisa la consola para más detalles.');
      }
    });
  }
}