import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductServices } from '../../../services/product';
import { Product } from '../../../interfaces/product.interface';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {
  private productService = inject(ProductServices);
  private route = inject(ActivatedRoute); 
  private cdr = inject(ChangeDetectorRef);
  public products: Product[] = [];

  ngOnInit() {
    // Nos suscribimos a los eventos de la ruta. Esto se disparará
    // de forma fiable cada vez que esta ruta esté activa.
    this.route.url.subscribe(() => {
      console.log('Ruta de lista de productos (admin) activada. Obteniendo productos...');
      this.fetchProducts();
    });
  }

  fetchProducts(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
      this.cdr.detectChanges();
    });
  }
}
