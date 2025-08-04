import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class WishlistComponent {
  // Simplemente inyectamos el servicio y lo hacemos público
  public wishlistService = inject(WishlistService);
}