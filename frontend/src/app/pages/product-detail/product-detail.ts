import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductServices, Review } from '../../services/product';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);
  private cdr = inject(ChangeDetectorRef);
  private cartservice = inject(CartService);

  public wishlistService = inject(WishlistService); // ¡Inyectar y hacerlo público!

  product: Product | null = null;
  reviews = signal<Review[]>([]);

  reviewForm = new FormGroup({
    // Por ahora, el autor es un campo de texto simple.
    author: new FormControl('Cliente Anónimo', Validators.required),
    rating: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
  });

  isProductInWishlist = computed(() => {
    if (this.product) {
      return this.wishlistService.isInWishlist(this.product._id);
    }
    return false;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');

      if (productId) {
        this.productService.getProductById(productId)
          .subscribe({
            next: (foundProduct) => {
              this.product = foundProduct;
              console.log('Producto encontrado:', this.product);
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al obtener el producto:', err);
            }
          });
        this.fetchReviews(productId);
      }
    });
  }

  addToCart(): void {
    if (this.product) {
      this.cartservice.addItem(this.product);
      alert(`${this.product.name} ha sido añadido al carrito!`);
    }
  }

  fetchReviews(productId: string): void {
    this.productService.getReviewsForProduct(productId)
      .subscribe(reviewsData => {
        this.reviews.set(reviewsData); // Actualizamos el signal de reseñas
      });
  }

   submitReview(): void {
    if (this.reviewForm.valid && this.product) {
      const formValue = this.reviewForm.value;
      
      // Creamos el objeto de la reseña a enviar
      const newReview = {
        author: formValue.author!,
        rating: formValue.rating!,
        title: formValue.title!,
        comment: formValue.comment!,
      };

      // Llamamos al nuevo método del servicio que vamos a crear
      this.productService.addReview(this.product._id, newReview)
        .subscribe(savedReview => {
          // Cuando la reseña se guarda, la añadimos al principio de nuestra lista local.
          this.reviews.update(currentReviews => [savedReview, ...currentReviews]);
          this.reviewForm.reset({ author: 'Cliente Anónimo' }); // Reseteamos el formulario
        });
    }
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (this.isProductInWishlist()) {
      // Si ya está, lo eliminamos
      this.wishlistService.removeProduct(this.product);
    } else {
      // Si no está, lo añadimos
      this.wishlistService.addProduct(this.product);
    }
  }

}