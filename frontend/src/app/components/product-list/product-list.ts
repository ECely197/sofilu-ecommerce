import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductServices } from '../../services/product';
import { Product } from '../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../product-card/product-card';
import { RouterModule } from '@angular/router';
import { ProductCardSkeleton } from '../product-card-skeleton/product-card-skeleton';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterModule, ProductCardSkeleton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  animations: [
    // Definimos un "disparador" de animación llamado 'cardAnimation'
    trigger('cardAnimation', [
      // La transición se aplica cuando cualquier elemento entra en la vista (':enter')
      transition(':enter', [
        // 'query' nos permite seleccionar elementos dentro del componente.
        // Seleccionamos todas las tarjetas de producto.
        query('app-product-card', [
          // Inicialmente, las tarjetas están invisibles y desplazadas hacia abajo.
          style({ opacity: 0, transform: 'translateY(20px)' }),
          // 'stagger' aplica la animación a cada elemento con un pequeño retraso (100ms)
          stagger(100, [
            // La animación en sí: dura 0.5s y las lleva a su estado final.
            animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)', 
                    style({ opacity: 1, transform: 'none' }))
          ])
        ], { optional: true }) // 'optional: true' evita errores si no hay tarjetas
      ])
    ])
  ]
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