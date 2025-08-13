// Contenido completo para: src/app/pages/product-detail/product-detail.ts

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Importaciones de Servicios y Tipos
import { ProductServices, Review } from '../../services/product';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';

// Directivas
import { RippleDirective } from '../../directives/ripple';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  // ¡Asegúrate de que todos los módulos y directivas estén importados!
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);
  private cartService = inject(CartService);
  public wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  // --- SIGNALS PARA EL ESTADO ---
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  reviews = signal<Review[]>([]);

  // Lógica para Variantes (Estado de la selección)
  selectedVariants = signal<{ [key: string]: string }>({});

  // Lógica para Pestañas (Tabs)
  activeTab = signal<'description' | 'reviews'>('description');

  // Lógica para el formulario de Reseñas
  private userOrders = signal<any[]>([]);
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

  // --- COMPUTED PROPERTIES ---
  isProductInWishlist = computed(() => {
    const p = this.product();
    return p ? this.wishlistService.isInWishlist(p._id) : false;
  });

  // --- CICLO DE VIDA ---
  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService
        .getProductById(productId)
        .subscribe((foundProduct) => {
          this.product.set(foundProduct);
          if (foundProduct.images.length > 0) {
            this.selectedImage.set(foundProduct.images[0]);
          }
          this.initializeVariants(foundProduct);
        });

      this.fetchReviews(productId);
      this.fetchUserOrders();
    }
  }

  // --- MÉTODOS PARA VARIANTES (CORREGIDOS Y ROBUSTOS) ---
  initializeVariants(p: Product): void {
    const initialSelection: { [key: string]: string } = {};
    p.variants.forEach((variant) => {
      if (variant.options.length > 0) {
        initialSelection[variant.name] = variant.options[0].name;
      }
    });
    this.selectedVariants.set(initialSelection);
  }

  selectOption(variantName: string, optionName: string): void {
    this.selectedVariants.update((currentSelection) => {
      const newSelection = { ...currentSelection };
      newSelection[variantName] = optionName;
      return newSelection;
    });
  }

  isSelected(variantName: string, optionName: string): boolean {
    // Verifica que la variante exista en la selección y que coincida con la opción
    return this.selectedVariants()[variantName] === optionName;
  }

  // --- OTROS MÉTODOS ---
  fetchReviews(productId: string): void {
    this.productService
      .getReviewsForProduct(productId)
      .subscribe((reviewsData) => {
        this.reviews.set(reviewsData);
      });
  }

  fetchUserOrders(): void {
    // Usamos el observable currentUser$ para reaccionar a login/logout
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.orderService.getOrdersForUser(user.uid).subscribe((orders) => {
          this.userOrders.set(orders);
        });
      } else {
        // Si el usuario cierra sesión, limpiamos sus pedidos
        this.userOrders.set([]);
      }
    });
  }

  // --- MÉTODO CORREGIDO PARA EL SCROLL ---
  scrollToReviewForm(): void {
    // Usamos un selector de CSS estándar que es más fiable en este caso
    const element = document.querySelector('.review-form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.error(
        'No se pudo encontrar el elemento del formulario de reseña.'
      );
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
        });
    }
  }

  addToCart(): void {
    const currentProduct = this.product();
    if (currentProduct) {
      // ¡EL CAMBIO CLAVE!
      // Ahora pasamos tanto el producto como el signal de las variantes seleccionadas.
      const variants = this.selectedVariants();
      this.cartService.addItem(currentProduct, variants);

      // En el futuro, reemplazaremos esto con un "toast" más elegante.
      alert(`${currentProduct.name} ha sido añadido al carrito!`);
    }
  }

  toggleWishlist(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    if (this.isProductInWishlist()) {
      this.wishlistService.removeProduct(currentProduct);
    } else {
      this.wishlistService.addProduct(currentProduct);
    }
  }
}
