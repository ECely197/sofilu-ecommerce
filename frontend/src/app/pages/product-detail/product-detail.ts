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
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';

// --- Servicios, Tipos y Componentes ---
import { ProductServices, Review } from '../../services/product';
import { Product, Option } from '../../interfaces/product.interface';
import { JsonLdService } from '../../services/json-ld.service';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { CategoryService, Category } from '../../services/category.service';
import { ProductAddonsComponent } from '../../components/product-addons/product-addons';

// --- Componentes Hijos ---
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { ProductCarousel } from '../../components/home/product-carousel/product-carousel';
import { RippleDirective } from '../../directives/ripple';
import { StarRatingComponent } from '../../components/star-rating/star-rating';

// --- Animaciones ---
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

// --- Librerías de Terceros ---
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
// Inicialización global de módulos de Swiper
Swiper.use([Pagination]);

// --- PIPE SEGURO ---
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
    ProductCarousel,
    ProductAddonsComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0 }),
      ),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('expanded <=> collapsed', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
  ],
})
export class ProductDetailComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  // --- INYECCIÓN DE DEPENDENCIAS ---
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
  private categoryService = inject(CategoryService);

  // --- SIGNALS (ESTADO) ---
  product = signal<Product | null>(null);
  selectedImage = signal<string>('');

  // Controla la animación de fade de la imagen principal (Desktop)
  isAnimatingImage = signal(false);

  reviews = signal<Review[]>([]);
  selectedVariants = signal<{ [key: string]: string }>({});
  activeTab = signal<'description' | 'reviews'>('description');
  private userOrders = signal<any[]>([]);
  justAddedToCart = signal(false);
  quantity = signal(1);
  expandedVariant = signal<string | null>(null);

  categories = signal<Category[]>([]);
  relatedProducts = signal<Product[]>([]);
  complementaryProducts = signal<Product[]>([]);

  private swiperInstance: Swiper | undefined;

  constructor() {
    // Efecto para manejar la galería y el swiper móvil reactivamente
    effect(() => {
      // Accedemos a galleryImages para que el efecto se ejecute cuando cambie
      const images = this.galleryImages();

      // Lógica para Swiper Móvil
      if (
        this.product() &&
        typeof window !== 'undefined' &&
        window.innerWidth < 1024
      ) {
        // Damos un pequeño respiro para que el HTML se actualice con las nuevas fotos
        setTimeout(() => this.initMobileSwiper(), 50);
      } else if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = undefined;
      }
    });
  }

  // --- COMPUTED PROPERTIES ---

  // 1. GALERÍA DINÁMICA: Mezcla las fotos base + las fotos de las variantes seleccionadas
  galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];

    let images = [...p.images];

    // Buscar imágenes de variantes seleccionadas
    const selections = this.selectedVariants();
    const variantImages: string[] = [];

    p.variants.forEach((variant) => {
      const selectedOptionName = selections[variant.name];
      if (selectedOptionName) {
        const option = variant.options.find(
          (o) => o.name === selectedOptionName,
        );
        // Si la opción tiene imagen y NO está ya en la lista base
        if (option && option.image && !images.includes(option.image)) {
          // La agregamos AL PRINCIPIO
          variantImages.unshift(option.image);
        }
      }
    });

    return [...variantImages, ...images];
  });

  variantPreviewImages = computed(() => {
    const product = this.product();
    if (!product) return {};
    const previews: { [key: string]: string } = {};
    product.variants.forEach((variant) => {
      const optionsWithImages = variant.options.filter((opt) => !!opt.image);
      if (optionsWithImages.length > 0) {
        previews[variant.name] = optionsWithImages[0].image!;
      }
    });
    return previews;
  });

  canAddToCart = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (p.status === 'Agotado') return false;
    if ((p.stock || 0) <= 0) return false;

    const selections = this.selectedVariants();
    for (const variantName in selections) {
      const selectedOptionName = selections[variantName];
      if (selectedOptionName) {
        const variant = p.variants.find((v) => v.name === variantName);
        const option = variant?.options.find(
          (o) => o.name === selectedOptionName,
        );
        if (option && (option.stock || 0) <= 0) {
          return false;
        }
      }
    }
    return true;
  });

  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    let totalPrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;
    const selections = this.selectedVariants();

    if (p.variants) {
      p.variants.forEach((variant) => {
        const selectedOptionName = selections[variant.name];
        if (selectedOptionName) {
          const option = variant.options.find(
            (opt) => opt.name === selectedOptionName,
          );
          if (option && option.price) {
            totalPrice += option.price;
          }
        }
      });
    }
    return totalPrice;
  });

  allVariantsSelected = computed(() => {
    const p = this.product();
    if (!p || !p.variants || p.variants.length === 0) return true;
    return p.variants.every(
      (variant) => !!this.selectedVariants()[variant.name],
    );
  });

  isInStock = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (p.status === 'Agotado') return false;
    return (p.stock || 0) > 0;
  });

  isProductInWishlist = computed(() => {
    const p = this.product();
    return p
      ? this.wishlistService.wishlistProductIds().includes(p._id)
      : false;
  });

  // Lógica de Reseñas (Permisiva para pruebas)
  canWriteReview = computed(() => {
    const user = this.authService.auth.currentUser;
    return !!user;
  });

  reviewForm = new FormGroup({
    author: new FormControl('', Validators.required),
    rating: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
  });

  // --- CICLO DE VIDA ---

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const productId = params.get('id');
      if (productId) {
        this.loadProductData(productId);
        this.fetchReviews(productId);
        this.fetchUserOrders();
      }
    });
    this.categoryService
      .getCategories()
      .subscribe((cats) => this.categories.set(cats));
    this.loadComplementaryProducts();
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.displayName)
        this.reviewForm.patchValue({ author: user.displayName });
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy(): void {
    this.jsonLdService.removeData();
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
    }
  }

  // --- MÉTODOS DE LÓGICA ---

  // Carga productos de la categoría 'cajas-sorpresa'
  loadComplementaryProducts(): void {
    // Reemplaza 'cajas-sorpresa' por el slug de la categoría que quieras mostrar
    const complementaryCategorySlug = 'peluches';

    this.productService
      .getProductsByCategory(complementaryCategorySlug)
      .subscribe((products) => {
        // Mostramos hasta 4 productos complementarios
        this.complementaryProducts.set(products.slice(0, 4));
      });
  }

  loadProductData(productId: string) {
    this.productService.getProductById(productId).subscribe({
      next: (foundProduct) => {
        this.product.set(foundProduct);
        this.quantity.set(1);
        this.selectedVariants.set({});

        if (foundProduct.images && foundProduct.images.length > 0) {
          this.selectedImage.set(foundProduct.images[0]);
        }

        this.setupSeo(foundProduct);
        this.setStructuredData(foundProduct);

        if (foundProduct.category) {
          const categorySlug =
            typeof foundProduct.category === 'object'
              ? foundProduct.category.slug
              : '';
          if (categorySlug) {
            this.productService
              .getProductsByCategory(categorySlug)
              .subscribe((products) => {
                const others = products.filter(
                  (p) => p._id !== foundProduct._id,
                );
                this.relatedProducts.set(others);
              });
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar el producto:', err);
        this.product.set(null);
      },
    });
  }

  // --- GESTIÓN DE IMAGEN (DESKTOP) ---
  setImage(imageUrl: string) {
    if (this.selectedImage() === imageUrl) return;

    this.isAnimatingImage.set(true);
    setTimeout(() => {
      this.selectedImage.set(imageUrl);
      setTimeout(() => this.isAnimatingImage.set(false), 50);
    }, 200);
  }

  // --- SELECCIÓN DE VARIANTES (CORREGIDA) ---
  selectOption(variantName: string, optionName: string, optionData: any): void {
    this.selectedVariants.update((current) => {
      const newSelection = { ...current };

      // Toggle: Si ya está seleccionada, la quitamos
      if (current[variantName] === optionName) {
        delete newSelection[variantName];

        // Si la foto actual era la de la variante que quitamos, volvemos a la principal
        if (this.selectedImage() === optionData.image) {
          const p = this.product();
          if (p && p.images.length > 0) {
            this.setImage(p.images[0]);
          }
        }
      } else {
        // Si es nueva selección
        newSelection[variantName] = optionName;

        // Si tiene imagen, la ponemos en Desktop
        if (optionData.image) {
          this.setImage(optionData.image);
        }
      }
      return newSelection;
    });
    // El 'effect' del constructor detectará el cambio en galleryImages y actualizará el Swiper
  }

  addToCart(): void {
    const p = this.product();

    if (!this.isInStock()) {
      this.toastService.show(
        'Lo sentimos, este producto está agotado.',
        'error',
      );
      return;
    }

    if (p && this.canAddToCart()) {
      this.cartService.addItem(p, this.selectedVariants(), this.quantity());

      this.toastService.show(`${p.name} añadido al carrito!`, 'success');

      this.justAddedToCart.set(true);
      setTimeout(() => {
        this.justAddedToCart.set(false);
        this.quantity.set(1);
      }, 2000);
    } else {
      this.toastService.show(
        'La opción seleccionada no está disponible.',
        'error',
      );
    }
  }

  increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }
  decreaseQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  toggleVariant(variantName: string): void {
    this.expandedVariant.update((current) =>
      current === variantName ? null : variantName,
    );
  }

  isSelected(variantName: string, optionName: string): boolean {
    return this.selectedVariants()[variantName] === optionName;
  }

  isOptionAvailable(option: Option): boolean {
    return (option.stock || 0) > 0;
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlistService.toggleProduct(p);
  }

  // --- SWIPER MÓVIL OPTIMIZADO ---
  private initMobileSwiper(): void {
    this.zone.runOutsideAngular(() => {
      // Si ya existe, lo actualizamos
      if (this.swiperInstance) {
        this.swiperInstance.update(); // Actualiza dimensiones y slides
        this.swiperInstance.slideTo(0); // Vuelve a la primera foto (la nueva variante)
        return;
      }

      // Si no existe, lo creamos
      const swiperEl = this.el.nativeElement.querySelector('.mobile-swiper');
      if (swiperEl) {
        this.swiperInstance = new Swiper(swiperEl, {
          slidesPerView: 1,
          spaceBetween: 0,
          // CLAVE: Observer para detectar cuando Angular añade divs al DOM
          observer: true,
          observeParents: true,
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
    const cleanDesc = product.description.replace(/<[^>]*>?/gm, '');
    const description = `${cleanDesc.substring(0, 120)}...`;
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({
      property: 'og:image',
      content: product.images[0] || '',
    });
  }

  private setStructuredData(p: Product) {
    /* ... lógica SEO ... */
  }

  fetchReviews(id: string) {
    this.productService
      .getReviewsForProduct(id)
      .subscribe((r) => this.reviews.set(r));
  }

  fetchUserOrders() {
    this.authService.currentUser$.subscribe((u) => {
      if (u)
        this.orderService
          .getOrdersForUser(u.uid)
          .subscribe((o) => this.userOrders.set(o));
    });
  }

  scrollToReviewForm() {
    setTimeout(() => {
      const el = document.querySelector('.review-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  submitReview() {
    const p = this.product();
    if (this.reviewForm.valid && p) {
      const val = this.reviewForm.value;
      const review = {
        author: val.author!,
        rating: val.rating!,
        title: val.title!,
        comment: val.comment!,
      };
      this.productService.addReview(p._id, review).subscribe((saved) => {
        this.reviews.update((curr) => [saved, ...curr]);
        this.reviewForm.reset({ author: '' });
        this.toastService.show('¡Reseña enviada!', 'success');
      });
    }
  }
}
