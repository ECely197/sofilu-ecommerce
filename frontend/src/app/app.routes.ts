import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ProductList } from './components/product-list/product-list';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { OrderConfirmation } from './pages/order-confirmation/order-confirmation';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Wishlist } from './pages/wishlist/wishlist';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { ProductList as AdminProductList } from './pages/admin/product-list/product-list';
import { ProductForm } from './pages/admin/product-form/product-form';
import { OrderList } from './pages/admin/order-list/order-list';
import { OrderDetail } from './pages/admin/order-detail/order-detail';
import { CustomerList } from './pages/admin/customer-list/customer-list';
import { CouponList } from './pages/admin/coupon-list/coupon-list';
import { couponForm } from './pages/admin/coupon-form/coupon-form';
import { settings } from './pages/admin/settings/settings';

export const routes: Routes = [

  {
    path: '',
    component: Home
  },
  {
    path: 'products',
    component: ProductList
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent
  },
  {
    path: 'cart',
    component: Cart
  },
  {
    path: 'checkout',
    component: Checkout
  },
  {
    path: 'order-confirmation',
    component: OrderConfirmation
  },
  {
    path: 'login', component: Login
  },
  {
    path: 'register', component: Register
  },
  {
    path: 'wishlist', component: Wishlist
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  {
    path: 'admin',
    component: AdminLayout, // ¡Usa nuestra nueva carcasa para TODAS las rutas de admin!
    // 'children' define las rutas que se renderizarán DENTRO del <router-outlet> del AdminLayout
    children: [
      {
        path: '', // Redirige /admin a /admin/dashboard
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard', // La ruta /admin/dashboard
        component: Dashboard
      },
      // Aquí añadiremos las otras páginas del admin (productos, pedidos, etc.)
    ]
  },

  {
    path: 'admin',
    component: AdminLayout,
    children: [
      // ... (ruta de dashboard)
      {
        path: 'products', // La ruta será /admin/products
        component: AdminProductList
      },
      // --- NUEVAS RUTAS ---
      {
        path: 'products/new', // Ruta para crear un producto nuevo
        component: ProductForm
      },
      {
        path: 'products/edit/:id', // Ruta para editar un producto existente
        component: ProductForm
      },
      {
        path: 'orders', // La ruta será /admin/orders
        component: OrderList
      },
      {
        path: 'orders/:id',
        component: OrderDetail
      },
      {
        path: 'customers',
        component: CustomerList
      },
      {
        path: 'coupons',
        component: CouponList
      },
      { path: 'coupons/new', component: couponForm },
      { path: 'coupons/edit/:id', component: couponForm },
      {
        path: 'settings',
        component: settings
      },
    ]
  }
];
