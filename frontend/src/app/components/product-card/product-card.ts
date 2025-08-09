import { Component, Input, inject, ElementRef, HostListener, computed } from '@angular/core';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { AuthService } from '../../services/auth';



@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input() product!: Product;

  private el = inject(ElementRef);
  public authService = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  // --- LÓGICA NUEVA PARA LA INCLINACIÓN ---
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const card = this.el.nativeElement.querySelector('.card');
    const { clientX, clientY } = event;
    const { left, top, width, height } = card.getBoundingClientRect();

    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    const rotateY = x * 20;
    const rotateX = -y * 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    const card = this.el.nativeElement.querySelector('.card');
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  }


  isProductInWishlist = computed(() =>
    this.wishlistService.isInWishlist(this.product._id)
  );

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.addItem(this.product);
    alert(`${this.product.name} añadido al carrito!`);
  }

  toggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.wishlistService.toggleProduct(this.product); 
  }
}
