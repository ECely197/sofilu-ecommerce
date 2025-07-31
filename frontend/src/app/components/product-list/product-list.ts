import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductServices } from '../../services/product';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../product-card/product-card';
import { RouterModule } from '@angular/router';
import { ProductCardSkeleton } from '../product-card-skeleton/product-card-skeleton';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterModule, ProductCardSkeleton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {
  private productService = inject(ProductServices);
  private cdr = inject(ChangeDetectorRef);
  
  products: Product[] = [];

  isLoading = signal(true);

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading.set(true); // Ponemos 'cargando' en true ANTES de la llamada
    this.productService.getProducts()
      .subscribe(data => {
        this.products = data;
        this.isLoading.set(false); // Ponemos 'cargando' en false CUANDO llegan los datos
        this.cdr.detectChanges();
      });
  }
}

//comentario de control