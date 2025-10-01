// En: frontend/src/app/pages/product-detail/product-detail.ts
/**
 * @fileoverview Componente de la Página de Detalle de Producto.
 * Este componente es el corazón de la experiencia de compra. Gestiona:
 * - Carga de datos del producto.
 * - Galería de imágenes interactiva.
 * - Selección de variantes de producto.
 * - Lógica de añadir al carrito y a la lista de deseos.
 * - Gestión de pestañas para descripción y reseñas.
 * - Formulario para enviar nuevas reseñas.
 * - SEO (títulos, metaetiquetas) y datos estructurados (JSON-LD).
 */

// --- Importaciones de Angular y Módulos ---
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

// --- Servicios, Tipos y Componentes Personalizados ---
import { ProductServices, Review } from '../../services/product';
import { Product, Option } from '../../interfaces/product.interface';
import { JsonLdService } from '../../services/json-ld.service';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { CategoryService, Category } from '../../services/category.service';
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { RippleDirective } from '../../directives/ripple';
import { StarRatingComponent } from '../../components/star-rating/star-rating';
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

/**
 * Pipe personalizado para renderizar HTML de forma segura,
 * previniendo ataques XSS. Esencial para descripciones de productos que vienen de un editor de texto enriquecido.
 */
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

  // --- ESTADO DEL COMPONENTE (SIGNALS) ---
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
  categories = signal<Category[]>([]);

  constructor() {
    // ¡MODIFICADO! El `effect` ahora reacciona a `galleryImages` para actualizar
    // la imagen seleccionada si la lista cambia.
    effect(() => {
      const images = this.galleryImages();
      // Si la imagen actualmente seleccionada ya no está en la galería,
      // volvemos a la primera imagen disponible.
      if (images.length > 0 && !images.includes(this.selectedImage())) {
        this.selectedImage.set(images[0]);
      }

      // Lógica de Swiper sin cambios
      if (this.product() && window.innerWidth < 768) {
        setTimeout(() => this.initMobileSwiper(), 50);
      } else if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = undefined;
      }
    });
  }

  //logica de galeria de imagenes

  galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];

    // 1. Empieza con las imágenes originales del producto.
    const images = [...p.images];

    // 2. Recorre las variantes seleccionadas.
    const selections = this.selectedVariants();
    for (const variantName in selections) {
      const selectedOptionName = selections[variantName];
      const variant = p.variants.find((v) => v.name === variantName);
      const option = variant?.options.find(
        (o) => o.name === selectedOptionName
      );
      // 3. Si la opción seleccionada tiene una imagen, la añade a la galería.
      if (option?.image) {
        images.push(option.image);
      }
    }
    return images;
  });

  //Animacion de acordeon para grupo de variantes

  variantPreviewImages = computed(() => {
    const product = this.product();
    if (!product) return {};

    const previews: { [key: string]: string } = {};
    product.variants.forEach((variant) => {
      // Filtra solo las opciones que tienen una imagen definida.
      const optionsWithImages = variant.options.filter((opt) => !!opt.image);
      if (optionsWithImages.length > 0) {
        // Selecciona una imagen aleatoria de las opciones disponibles.
        const randomIndex = Math.floor(
          Math.random() * optionsWithImages.length
        );
        previews[variant.name] = optionsWithImages[randomIndex].image!;
      }
    });
    return previews;
  });

  toggleVariant(variantName: string): void {
    this.expandedVariant.update((current) =>
      current === variantName ? null : variantName
    );
  }

  canAddToCart = computed(() => {
    const p = this.product();
    if (!p) return false;

    // Si no hay variantes, solo importa el stock del producto principal (lógica futura).
    if (p.variants.length === 0) return true;

    // Si hay variantes, verificamos que las seleccionadas (si las hay) tengan stock.
    const selections = this.selectedVariants();
    for (const variantName in selections) {
      const selectedOptionName = selections[variantName];
      const variant = p.variants.find((v) => v.name === variantName);
      const option = variant?.options.find(
        (o) => o.name === selectedOptionName
      );
      if (option && (option.stock || 0) <= 0) {
        return false; // Si CUALQUIER opción seleccionada está sin stock, deshabilita.
      }
    }

    return true; // Si todo lo seleccionado tiene stock, habilita.
  });

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

    // 1. Empezamos SIEMPRE con el precio base del producto.
    // Si está en oferta, usamos el precio de oferta.
    let totalPrice = p.isOnSale && p.salePrice ? p.salePrice : p.price;

    // 2. Obtenemos las variantes que el usuario ha seleccionado.
    const selections = this.selectedVariants();

    // 3. Iteramos sobre cada variante del producto (ej: "Empaque", "Acompañamiento").
    p.variants.forEach((variant) => {
      // Verificamos si el usuario ha seleccionado una opción para esta variante.
      const selectedOptionName = selections[variant.name];
      if (selectedOptionName) {
        // Si la seleccionó, buscamos esa opción en los datos del producto.
        const option = variant.options.find(
          (opt) => opt.name === selectedOptionName
        );
        // Si la opción existe y tiene un precio, lo SUMAMOS al total.
        if (option && option.price) {
          totalPrice += option.price;
        }
      }
    });

    return totalPrice;
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
    if (p.status === 'Agotado') return false;

    if (p.variants && p.variants.length > 0) {
      // ¡CORRECCIÓN! Usamos el nombre correcto aquí también
      if (!this.allVariantsSelected()) return false;

      return p.variants.every((variant) => {
        const selectedOptionName = this.selectedVariants()[variant.name];
        const option = variant.options.find(
          (opt) => opt.name === selectedOptionName
        );
        return (option?.stock || 0) > 0;
      });
    }
    return (p.stock || 0) > 0;
  });

  // --- MÉTODO isOptionAvailable (sin cambios, ya era correcto) ---

  isOptionAvailable(option: Option): boolean {
    return (option.stock || 0) > 0;
  }

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
    this.selectedVariants.update((current) => {
      const newSelection = { ...current };
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

  addToCart(): void {
    const p = this.product();
    // ¡MODIFICADO! Usamos el nuevo `canAddToCart` para la validación.
    if (p && this.canAddToCart()) {
      this.cartService.addItem(p, this.selectedVariants(), this.quantity());
      this.toastService.show(
        `${p.name} (x${this.quantity()}) añadido al carrito!`,
        'success'
      );
      this.justAddedToCart.set(true);
      setTimeout(() => {
        this.justAddedToCart.set(false);
        this.quantity.set(1);
      }, 2000);
    } else {
      this.toastService.show(
        'Una de las opciones seleccionadas no está disponible.',
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
