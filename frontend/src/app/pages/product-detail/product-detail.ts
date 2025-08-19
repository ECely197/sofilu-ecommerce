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
import { Product, Option, Variant } from '../../interfaces/product.interface';
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

  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;

    let modifier = 0;
    const selection = this.selectedVariants();

    p.variants.forEach((variant) => {
      const selectedOptionName = selection[variant.name];
      const selectedOption = variant.options.find(
        (opt) => opt.name === selectedOptionName
      );
      if (selectedOption) {
        modifier += selectedOption.priceModifier;
      }
    });

    return p.price + modifier;
  });

  // Encuentra la combinación de opciones seleccionada actualmente
  currentSelectionData = computed(() => {
    const p = this.product();
    const selection = this.selectedVariants();
    if (!p || p.variants.length === 0) return null;

    // Lógica para encontrar la opción final (simplificada para una sola variante por ahora)
    // Se puede expandir para combinaciones más complejas si es necesario
    const firstVariant = p.variants[0];
    const selectedOptionName = selection[firstVariant.name];
    return (
      firstVariant.options.find((opt) => opt.name === selectedOptionName) ||
      null
    );
  });

  // Verifica si la selección actual tiene stock
  isInStock = computed(() => {
    const selection = this.currentSelectionData();
    return selection ? selection.stock > 0 : false;
  });

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
          if (foundProduct.images.length > 0)
            this.selectedImage.set(foundProduct.images[0]);
          this.initializeVariants(foundProduct);
        });

      this.fetchReviews(productId);
      this.fetchUserOrders();
    }
  }

  // --- MÉTODOS PARA VARIANTES (CORREGIDOS Y ROBUSTOS) ---

  initializeVariants(p: Product): void {
    const initialSelection: { [key: string]: string } = {};
    if (!p.variants || p.variants.length === 0) {
      this.selectedVariants.set(initialSelection);
      return;
    }

    // 1. Aplanamos todas las opciones en un solo array, guardando el nombre de su variante
    const allOptions = p.variants.flatMap((variant) =>
      variant.options.map((option) => ({
        ...option,
        variantName: variant.name,
      }))
    );

    // 2. Si no hay opciones, no hacemos nada
    if (allOptions.length === 0) {
      this.selectedVariants.set(initialSelection);
      return;
    }

    // 3. Encontramos la opción más barata de todas
    const cheapestOption = allOptions.reduce((lowest, current) =>
      p.price + current.priceModifier < p.price + lowest.priceModifier
        ? current
        : lowest
    );

    // 4. Construimos la selección inicial basándonos en la opción más barata,
    //    y rellenamos las demás variantes con su primera opción por defecto.
    p.variants.forEach((variant) => {
      if (variant.name === cheapestOption.variantName) {
        initialSelection[variant.name] = cheapestOption.name;
      } else if (variant.options.length > 0) {
        initialSelection[variant.name] = variant.options[0].name;
      }
    });

    this.selectedVariants.set(initialSelection);
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
    if (p && this.isInStock()) {
      this.cartService.addItem(p, this.selectedVariants());
      alert(`${p.name} ha sido añadido al carrito!`);
    }
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
