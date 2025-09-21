// En: frontend/src/app/pages/product-detail/product-detail.ts

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  Pipe,
  PipeTransform,
  ElementRef,
  NgZone,
  effect,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Servicios, Tipos y Directivas
import { ProductServices, Review } from '../../services/product';
import { JsonLdService } from '../../services/json-ld.service';
import { Product, Option } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { RippleDirective } from '../../directives/ripple';
import { ToastService } from '../../services/toast.service';
import { StarRatingComponent } from '../../components/star-rating/star-rating';

// Importamos Swiper para la galería móvil
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
Swiper.use([Pagination]);

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
export class ProductDetailComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  // --- INYECCIONES ---
  private route = inject(ActivatedRoute);
  private productService = inject(ProductServices);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  public wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private jsonLdService = inject(JsonLdService);
  private el = inject(ElementRef);
  private zone = inject(NgZone);

  // --- SIGNALS ---
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');
  reviews = signal<Review[]>([]);
  selectedVariants = signal<{ [key: string]: string }>({});
  activeTab = signal<'description' | 'reviews'>('description');
  private userOrders = signal<any[]>([]);
  justAddedToCart = signal(false);
  quantity = signal(1);
  private swiperInstance: Swiper | undefined;

  constructor() {
    effect(() => {
      const currentProduct = this.product();

      if (currentProduct && window.innerWidth < 768) {
        setTimeout(() => this.initMobileSwiper(), 50);
      } else if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = undefined;
      }
    });
  }

  // --- MÉTODOS DE CANTIDAD ---
  increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }
  decreaseQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  // --- COMPUTED PROPERTIES ---
  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;

    // Si no hay variantes, el precio es el base (o el de oferta)
    if (p.variants.length === 0) {
      return p.isOnSale && p.salePrice ? p.salePrice : p.price;
    }

    // Si hay variantes, el precio es el de la opción seleccionada
    const selection = this.selectedVariants();
    if (this.allVariantsSelected()) {
      const firstVariant = p.variants[0]; // Simplificación: asumimos que el precio está en la primera variante
      const selectedOptionName = selection[firstVariant.name];
      const option = firstVariant.options.find(
        (opt) => opt.name === selectedOptionName
      );
      return option?.price || 0;
    }

    // Si no se han seleccionado todas las variantes, mostramos el precio más bajo
    const allPrices = p.variants.flatMap((v) => v.options.map((o) => o.price));
    return allPrices.length > 0 ? Math.min(...allPrices) : p.price;
  });

  allVariantsSelected = computed(() => {
    const p = this.product();
    if (!p || p.variants.length === 0) return true;
    return p.variants.every(
      (variant) => !!this.selectedVariants()[variant.name]
    );
  });

  isInStock = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (p.variants.length === 0) return true;
    if (!this.allVariantsSelected()) return false;

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
    return p
      ? this.wishlistService.wishlistProductIds().includes(p._id)
      : false;
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

          if (foundProduct.images && foundProduct.images.length > 0) {
            this.selectedImage.set(foundProduct.images[0]);
          }

          this.initializeVariants(foundProduct);
          this.setupSeo(foundProduct);
          this.setStructuredData(foundProduct);
        },
        error: (err) => {
          console.error('Error al cargar el producto:', err);
          this.product.set(null);
        },
      });
      this.fetchReviews(productId);
      this.fetchUserOrders();
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy(): void {
    this.jsonLdService.removeData();
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
  }

  // --- MÉTODOS ---
  private initMobileSwiper(): void {
    this.zone.runOutsideAngular(() => {
      if (this.swiperInstance) {
        this.swiperInstance.update();
        return;
      }

      const swiperEl = this.el.nativeElement.querySelector('.mobile-swiper');
      if (swiperEl) {
        this.swiperInstance = new Swiper(swiperEl, {
          slidesPerView: 1,
          spaceBetween: 16,
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        });
      }
    });
  }

  private setupSeo(product: Product): void {
    const title = `Sofilu | ${product.name}`;
    const cleanDescription = product.description.replace(/<[^>]*>?/gm, '');
    const description = `${cleanDescription.substring(
      0,
      120
    )}... Encuentra el mejor confort y estilo en Sofilu.`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({
      property: 'og:image',
      content: product.images[0] || '',
    });
    this.metaService.updateTag({
      property: 'og:url',
      content: `https://www.sofilu.shop/product/${product._id}`,
    });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Sofilu' });
  }

  private setStructuredData(product: Product): void {
    const prices = product.variants.flatMap((v) =>
      v.options.map((o) => o.price)
    );
    const lowPrice = prices.length > 0 ? Math.min(...prices) : product.price;

    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: product.images[0] || '',
      description: product.description.replace(/<[^>]*>?/gm, ''),
      sku: product.sku || product._id,
      brand: { '@type': 'Brand', name: 'Sofilu' },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'COP',
        lowPrice: lowPrice,
        availability: product.variants.some((v) =>
          v.options.some((o) => o.stock > 0)
        )
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `https://www.sofilu.shop/product/${product._id}`,
      },
    };
    this.jsonLdService.setData(schema);
  }

  initializeVariants(p: Product): void {
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
      this.cartService.addItem(p, this.selectedVariants(), this.quantity());
      this.toastService.show(
        `${p.name} (x${this.quantity()}) ha sido añadido al carrito!`,
        'success'
      );
      this.justAddedToCart.set(true);
      setTimeout(() => {
        this.justAddedToCart.set(false);
        this.quantity.set(1);
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
