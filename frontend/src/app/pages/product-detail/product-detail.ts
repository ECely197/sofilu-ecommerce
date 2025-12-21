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
import { ActivatedRoute } from '@angular/router';
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
    CategoriesSection,
    ProductCarousel,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0 })
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
  reviews = signal<Review[]>([]);
  selectedVariants = signal<{ [key: string]: string }>({});
  activeTab = signal<'description' | 'reviews'>('description');
  private userOrders = signal<any[]>([]);
  justAddedToCart = signal(false);
  quantity = signal(1);
  expandedVariant = signal<string | null>(null);
  private swiperInstance: Swiper | undefined;
  
  // Datos para secciones inferiores
  categories = signal<Category[]>([]);
  relatedProducts = signal<Product[]>([]);

  constructor() {
    // Efecto para manejar la galería y el swiper móvil
    effect(() => {
      const images = this.galleryImages();
      // Si la imagen seleccionada ya no es válida (por cambio de variante), resetear a la primera
      if (images.length > 0 && !images.includes(this.selectedImage())) {
        this.selectedImage.set(images[0]);
      }

      // Inicializar Swiper solo en móvil
      if (this.product() && window.innerWidth < 768) {
        setTimeout(() => this.initMobileSwiper(), 50);
      } else if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = undefined;
      }
    });
  }

  // --- COMPUTED PROPERTIES ---

  // Filtra las imágenes según las variantes seleccionadas
  galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const images = [...p.images];
    const selections = this.selectedVariants();
    for (const variantName in selections) {
      const selectedOptionName = selections[variantName];
      const variant = p.variants.find((v) => v.name === variantName);
      const option = variant?.options.find(
        (o) => o.name === selectedOptionName
      );
      if (option?.image) {
        images.push(option.image);
      }
    }
    return images;
  });

  // Obtiene una imagen de previsualización para el acordeón de variantes
  variantPreviewImages = computed(() => {
    const product = this.product();
    if (!product) return {};
    const previews: { [key: string]: string } = {};
    product.variants.forEach((variant) => {
      const optionsWithImages = variant.options.filter((opt) => !!opt.image);
      if (optionsWithImages.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * optionsWithImages.length
        );
        previews[variant.name] = optionsWithImages[randomIndex].image!;
      }
    });
    return previews;
  });

  // LÓGICA FLEXIBLE: Permite añadir al carrito incluso si no hay variantes seleccionadas,
  // a menos que la opción seleccionada explícitamente esté sin stock.
  canAddToCart = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (p.status === 'Agotado') return false;

    // 1. Verificamos stock base del producto (si manejas stock global)
    if ((p.stock || 0) <= 0) return false;

    // 2. Verificamos SOLO las opciones que el usuario ha seleccionado activamente
    const selections = this.selectedVariants();
    for (const variantName in selections) {
      const selectedOptionName = selections[variantName];
      if (selectedOptionName) {
        const variant = p.variants.find((v) => v.name === variantName);
        const option = variant?.options.find(
          (o) => o.name === selectedOptionName
        );
        // Si seleccionó algo y ese algo no tiene stock, bloqueamos.
        if (option && (option.stock || 0) <= 0) {
          return false; 
        }
      }
    }

    // Si no seleccionó nada (compra el producto base) o lo que seleccionó tiene stock -> TRUE
    return true;
  });

  // Calcula el precio total sumando las opciones
  finalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    let totalPrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;
    const selections = this.selectedVariants();
    p.variants.forEach((variant) => {
      const selectedOptionName = selections[variant.name];
      if (selectedOptionName) {
        const option = variant.options.find(
          (opt) => opt.name === selectedOptionName
        );
        if (option && option.price) {
          totalPrice += option.price;
        }
      }
    });
    return totalPrice;
  });

  // Verifica si todas las variantes posibles han sido seleccionadas (solo para UI, no bloquea compra)
  allVariantsSelected = computed(() => {
    const p = this.product();
    if (!p || p.variants.length === 0) return true;
    return p.variants.every(
      (variant) => !!this.selectedVariants()[variant.name]
    );
  });

  // Verifica stock general
  isInStock = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (p.status === 'Agotado') return false;
    return (p.stock || 0) > 0;
  });

  // Helper para la UI de opciones
  isOptionAvailable(option: Option): boolean {
    return (option.stock || 0) > 0;
  }

  isProductInWishlist = computed(() => {
    const p = this.product();
    return p
      ? this.wishlistService.wishlistProductIds().includes(p._id)
      : false;
  });

  // Verifica si el usuario compró el producto para dejar reseña
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
    // Suscripción a cambios de ruta para cargar nuevos productos sin recargar página
    this.route.paramMap.subscribe((params) => {
      const productId = params.get('id');
      if (productId) {
        this.loadProductData(productId);
        this.fetchReviews(productId);
        this.fetchUserOrders();
      }
    });

    // Cargar categorías para la sección inferior
    this.categoryService.getCategories().subscribe((cats) => {
      this.categories.set(cats);
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

  loadProductData(productId: string) {
    this.productService.getProductById(productId).subscribe({
      next: (foundProduct) => {
        this.product.set(foundProduct);
        this.quantity.set(1);
        this.selectedVariants.set({}); // Resetear variantes al cambiar de producto

        if (foundProduct.images && foundProduct.images.length > 0) {
          this.selectedImage.set(foundProduct.images[0]);
        }

        this.initializeVariants(foundProduct);
        this.setupSeo(foundProduct);
        this.setStructuredData(foundProduct);

        // Cargar productos relacionados
        if (foundProduct.category) {
          const categorySlug = typeof foundProduct.category === 'object' ? foundProduct.category.slug : ''; 
          if (categorySlug) {
            this.productService.getProductsByCategory(categorySlug).subscribe(products => {
              const others = products.filter(p => p._id !== foundProduct._id);
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

  // Añadir al Carrito (Versión Flexible)
  addToCart(): void {
    const p = this.product();
    
    // 1. Verificación básica de disponibilidad
    if (!this.isInStock()) {
      this.toastService.show('Lo sentimos, este producto está agotado.', 'error');
      return;
    }

    // 2. Verificación de validez de la selección (canAddToCart maneja la lógica flexible)
    if (p && this.canAddToCart()) {
      this.cartService.addItem(p, this.selectedVariants(), this.quantity());
      
      this.toastService.show(
        `${p.name} añadido al carrito!`,
        'success'
      );
      
      // Feedback visual en el botón
      this.justAddedToCart.set(true);
      setTimeout(() => {
        this.justAddedToCart.set(false);
        this.quantity.set(1); // Reset cantidad
      }, 2000);
    } else {
      // Solo entra aquí si eligió una variante que no tiene stock
      this.toastService.show(
        'La opción seleccionada no está disponible.',
        'error'
      );
    }
  }

  // --- UTILS ---
  increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }
  decreaseQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  toggleVariant(variantName: string): void {
    this.expandedVariant.update((current) =>
      current === variantName ? null : variantName
    );
  }

  selectOption(variantName: string, optionName: string): void {
    this.selectedVariants.update((current) => {
      const newSelection = { ...current };
      // Lógica de toggle: si ya está, lo quita. Si no, lo pone.
      if (current[variantName] === optionName) {
        delete newSelection[variantName];
      } else {
        newSelection[variantName] = optionName;
      }
      return newSelection;
    });
  }

  isSelected(variantName: string, optionName: string): boolean {
    return this.selectedVariants()[variantName] === optionName;
  }

  toggleWishlist(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;
    this.wishlistService.toggleProduct(currentProduct);
  }

  // --- AUXILIARES (SEO, Swiper, Reseñas) ---

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
    const description = `${cleanDescription.substring(0, 120)}... Encuentra el mejor confort y estilo en Sofilu.`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: product.images[0] || '' });
    this.metaService.updateTag({ property: 'og:url', content: `https://www.sofilu.shop/product/${product._id}` });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Sofilu' });
  }

  private setStructuredData(product: Product): void {
    const prices = product.variants.flatMap((v) => v.options.map((o) => o.price));
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
}