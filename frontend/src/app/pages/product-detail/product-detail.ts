// Contenido Completo, Corregido y Final para: frontend/src/app/pages/product-detail/product-detail.ts

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Servicios, Tipos y Directivas
import { ProductServices, Review } from '../../services/product';
import { Product, Option } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { RippleDirective } from '../../directives/ripple';
import { ToastService } from '../../services/toast.service';

import { StarRatingComponent } from '../../components/star-rating/star-rating';

// Pipe para renderizar HTML de forma segura
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RippleDirective,
    SafeHtmlPipe,
    StarRatingComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  public wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  // --- SIGNALS PARA EL ESTADO ---
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  reviews = signal<Review[]>([]);
  selectedVariants = signal<{ [key: string]: string }>({});
  activeTab = signal<'description' | 'reviews'>('description');
  private userOrders = signal<any[]>([]);
  justAddedToCart = signal(false);
  quantity = signal(1);

  increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  decreaseQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  // --- COMPUTED PROPERTIES (Lógica derivada del estado) ---

  // Calcula el precio final sumando los modificadores de las variantes seleccionadas.
  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;

    const basePrice = p.price || 0;
    const modifier = p.variants.reduce((total, variant) => {
      const selectedOptionName = this.selectedVariants()[variant.name];
      if (selectedOptionName) {
        const option = variant.options.find(
          (opt) => opt.name === selectedOptionName
        );
        return total + (option?.priceModifier || 0);
      }
      return total;
    }, 0);

    return basePrice + modifier;
  });

  // Verifica si se ha seleccionado una opción para CADA una de las variantes del producto.
  allVariantsSelected = computed(() => {
    const p = this.product();
    if (!p || p.variants.length === 0) return true; // Si no hay variantes, es verdadero.
    return p.variants.every(
      (variant) => !!this.selectedVariants()[variant.name]
    );
  });

  // Verifica si la combinación de variantes seleccionada tiene stock.
  isInStock = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (!this.allVariantsSelected()) return false; // Si no se ha seleccionado todo, no hay stock.
    if (p.variants.length === 0) return true; // Si no hay variantes, asumimos stock.

    // Comprueba el stock de cada opción seleccionada. Si alguna es 0, el producto no está en stock.
    return p.variants.every((variant) => {
      const selectedOptionName = this.selectedVariants()[variant.name];
      const option = variant.options.find(
        (opt) => opt.name === selectedOptionName
      );
      return (option?.stock || 0) > 0;
    });
  });

  isProductInWishlist = computed(() => {
    const p = this.product();
    if (!p) return false;
    return this.wishlistService.wishlistProductIds().includes(p._id);
  });

  canWriteReview = computed(() => {
    const p = this.product();
    if (!p || this.userOrders().length === 0) return false;
    return this.userOrders().some((order) =>
      order.items.some((item: any) => item.product?._id === p._id)
    );
  });

  reviewForm = new FormGroup({
    author: new FormControl('Cliente Anónimo', Validators.required),
    rating: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
  });

  // --- CICLO DE VIDA ---
  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductById(productId).subscribe({
        next: (foundProduct) => {
          this.product.set(foundProduct);
          // Aseguramos que 'selectedImage' se inicialice solo si hay imágenes
          if (foundProduct.images && foundProduct.images.length > 0) {
            this.selectedImage.set(foundProduct.images[0]);
          }
          this.initializeVariants(foundProduct);
        },
        error: (err) => {
          console.error('Error al cargar el producto:', err);
          this.product.set(null); // En caso de error, aseguramos que el producto sea nulo
        },
      });
      this.fetchReviews(productId);
      this.fetchUserOrders();
    }
  }

  // --- MÉTODOS ---

  initializeVariants(p: Product): void {
    // Reiniciamos las variantes a un objeto vacío para forzar al usuario a seleccionar
    this.selectedVariants.set({});
  }

  selectOption(variantName: string, optionName: string): void {
    this.selectedVariants.update((current) => ({
      ...current,
      [variantName]: optionName,
    }));
  }

  isOptionAvailable(option: Option): boolean {
    return option.stock > 0;
  }

  isSelected(variantName: string, optionName: string): boolean {
    return this.selectedVariants()[variantName] === optionName;
  }

  addToCart(): void {
    const p = this.product();
    if (p && this.allVariantsSelected() && this.isInStock()) {
      // Pasamos la cantidad actual del signal a nuestro servicio
      this.cartService.addItem(p, this.selectedVariants(), this.quantity());

      this.toastService.show(
        `${p.name} (x${this.quantity()}) ha sido añadido al carrito!`,
        'success'
      );

      this.justAddedToCart.set(true);
      setTimeout(() => {
        this.justAddedToCart.set(false);
        this.quantity.set(1); // Reseteamos la cantidad a 1 después de añadir
      }, 2000);
    } else {
      this.toastService.show(
        'Por favor, selecciona una opción disponible.',
        'error'
      );
    }
  }

  fetchReviews(productId: string): void {
    this.productService
      .getReviewsForProduct(productId)
      .subscribe((reviewsData) => {
        this.reviews.set(reviewsData);
      });
  }

  fetchUserOrders(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.orderService.getOrdersForUser(user.uid).subscribe((orders) => {
          this.userOrders.set(orders);
        });
      } else {
        this.userOrders.set([]);
      }
    });
  }

  scrollToReviewForm(): void {
    const element = document.querySelector('.review-form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  submitReview(): void {
    const currentProduct = this.product();
    if (this.reviewForm.valid && currentProduct) {
      const formValue = this.reviewForm.value;
      const newReview = {
        author: formValue.author!,
        rating: formValue.rating!,
        title: formValue.title!,
        comment: formValue.comment!,
      };
      this.productService
        .addReview(currentProduct._id, newReview)
        .subscribe((savedReview) => {
          this.reviews.update((currentReviews) => [
            savedReview,
            ...currentReviews,
          ]);
          this.reviewForm.reset({ author: 'Cliente Anónimo' });
          this.toastService.show('¡Gracias por tu reseña!', 'success');
        });
    }
  }

  toggleWishlist(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;
    this.wishlistService.toggleProduct(currentProduct);
  }
}
