import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist';
// Importamos el ProductCardComponent para reutilizarlo. ¡Poder de los componentes!
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wishlist',
   standalone: true,
  // ¡Lo importamos aquí!
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class Wishlist {
  public wishlistService = inject(WishlistService);
}
