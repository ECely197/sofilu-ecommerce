import { Routes } from '@angular/router';

// Layouts
import { AdminLayout} from './layouts/admin-layout/admin-layout';

// Guards
import { AuthGuard } from './guards/auth-guard'; // ¡Importamos la CLASE!

// Componentes de Página del Cliente
import { Home} from './pages/home/home';
import { ProductList} from './components/product-list/product-list';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { Cart} from './pages/cart/cart';
import { checkout} from './pages/checkout/checkout';
import { OrderConfirmation } from './pages/order-confirmation/order-confirmation';
import { Login } from './pages/login/login';
import { Register} from './pages/register/register';
import { WishlistComponent } from './pages/wishlist/wishlist';

// Componentes de Página del Admin
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { ProductList as AdminProductListComponent } from './pages/admin/product-list/product-list';
import { ProductForm } from './pages/admin/product-form/product-form';
import { OrderList } from './pages/admin/order-list/order-list';
import { OrderDetail} from './pages/admin/order-detail/order-detail';
import { CustomerList } from './pages/admin/customer-list/customer-list';
import { CouponList } from './pages/admin/coupon-list/coupon-list';
import { couponForm } from './pages/admin/coupon-form/coupon-form';
import { settings } from './pages/admin/settings/settings';

export const routes: Routes = [
  // --- Rutas del Cliente (Públicas y para usuarios) ---
  { path: '', component: Home },
  { path: 'products', component: ProductList },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: Cart},
  { path: 'checkout', component: checkout },
  { path: 'order-confirmation', component: OrderConfirmation },
  { path: 'login', component: Login},
  { path: 'register', component: Register },
  { path: 'wishlist', component: WishlistComponent },

  // --- Rutas del Panel de Administración (Protegidas) ---
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [AuthGuard], // ¡Aplicamos el guardia a la ruta padre!
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'products', component: AdminProductListComponent },
      { path: 'products/new', component: ProductForm },
      { path: 'products/edit/:id', component: ProductForm},
      { path: 'orders', component: OrderList },
      { path: 'orders/:id', component: OrderDetail},
      { path: 'customers', component: CustomerList },
      { path: 'coupons', component: CouponList },
      { path: 'coupons/new', component: couponForm },
      { path: 'coupons/edit/:id', component: couponForm },
      { path: 'settings', component: settings },
    ]
  },

  // (Opcional) Una ruta "catch-all" para redirigir al inicio si la URL no existe
  // { path: '**', redirectTo: '' }
];