import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductServices, Review } from '../../services/product';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
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
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  public wishlistService = inject(WishlistService);

  product: Product | null = null;
  reviews = signal<Review[]>([]);
  
  isProductInWishlist = computed(() => {
    if (this.product) {
      return this.wishlistService.isInWishlist(this.product._id);
    }
    return false;
  });

  reviewForm = new FormGroup({
    author: new FormControl('Cliente Anónimo', Validators.required), 
    rating: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.productService.getProductById(productId).subscribe(foundProduct => {
          this.product = foundProduct;
          this.cdr.detectChanges();
          this.fetchReviews(productId);
        });
      }
    });
  }

  fetchReviews(productId: string): void {
    this.productService.getReviewsForProduct(productId).subscribe(reviewsData => {
      this.reviews.set(reviewsData);
    });
  }
  
  submitReview(): void {
    if (this.reviewForm.valid && this.product) {
      const formValue = this.reviewForm.value;
      const newReview = {
        author: formValue.author!,
        rating: formValue.rating!,
        title: formValue.title!,
        comment: formValue.comment!,
      };
      this.productService.addReview(this.product._id, newReview).subscribe(savedReview => {
        this.reviews.update(currentReviews => [savedReview, ...currentReviews]);
        this.reviewForm.reset({ author: 'Cliente Anónimo' });
      });
    }
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addItem(this.product);
      alert(`${this.product.name} ha sido añadido al carrito!`);
    }
  }

  toggleWishlist(): void {
    if (!this.product) return;
    
    if (this.isProductInWishlist()) {
      this.wishlistService.removeProduct(this.product);
    } else {
      this.wishlistService.addProduct(this.product);
    }
  }
}