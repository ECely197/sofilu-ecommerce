/**
 * =========================================================================
 * DEFINICIÓN DE RUTAS DE LA APLICACIÓN
 * =========================================================================
 * Este archivo define el mapa de navegación de toda la Single-Page Application (SPA).
 * Asocia una URL específica a un componente que debe renderizarse.
 */

import { Routes } from '@angular/router';

// Guards de Ruta: Protegen rutas para que solo sean accesibles bajo ciertas condiciones.
import { AuthGuard } from './guards/auth-guard'; // Solo para administradores
import { LoginGuard } from './guards/login-guard'; // Solo para usuarios logueados

// --- Componentes y Layouts ---
// Layouts (componentes que contienen un <router-outlet> para rutas hijas)
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Account } from './pages/account/account/account';

// Páginas del Cliente
import { Home } from './pages/home/home';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { checkout } from './pages/checkout/checkout';
import { OrderConfirmation } from './pages/order-confirmation/order-confirmation';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { SearchResultsComponent } from './pages/search-results/search-results';

// Páginas de la Cuenta del Usuario (Rutas Hijas de 'Account')
import { MyOrdersComponent } from './pages/account/my-orders/my-orders';
import { MyAddressesComponent } from './pages/account/my-addresses/my-addresses';
import { MyDetailsComponent } from './pages/account/my-details/my-details';

// Páginas de Administración (Rutas Hijas de 'AdminLayout')
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { ProductList as AdminProductListComponent } from './pages/admin/product-list/product-list';
import { ProductForm } from './pages/admin/product-form/product-form';
import { OrderList } from './pages/admin/order-list/order-list';
import { OrderDetail } from './pages/admin/order-detail/order-detail';
import { CustomerList } from './pages/admin/customer-list/customer-list';
import { CouponList } from './pages/admin/coupon-list/coupon-list';
import { couponForm } from './pages/admin/coupon-form/coupon-form';
import { settings } from './pages/admin/settings/settings';
import { InvoiceViewComponent } from './pages/admin/invoice-view/invoice-view';
import { CategoryList } from './pages/admin/category-list/category-list';
import { CategoryFormComponent } from './pages/admin/category-form/category-form';
import { VariantTemplatesComponent } from './pages/admin/variant-templates/variant-templates';
import { SectionsComponent } from './pages/admin/sections/sections';
import { VendorsComponent } from './pages/admin/vendors/vendors';
import { SpecialEvents } from './pages/admin/special-events/special-events';

export const routes: Routes = [
  // ===================================
  // --- Rutas de la Tienda (Cliente) ---
  // ===================================
  { path: '', component: Home, data: { animation: 'HomePage' } },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
    data: { animation: 'ProductDetailPage' },
  },
  { path: 'cart', component: Cart, data: { animation: 'CartPage' } },
  {
    path: 'checkout',
    component: checkout,
    data: { animation: 'CheckoutPage' },
  },
  {
    path: 'order-confirmation/:id',
    component: OrderConfirmation,
    data: { animation: 'ConfirmationPage' },
  },
  { path: 'login', component: Login, data: { animation: 'LoginPage' } },
  {
    path: 'register',
    component: Register,
    data: { animation: 'RegisterPage' },
  },
  {
    path: 'search',
    component: SearchResultsComponent,
    data: { animation: 'SearchPage' },
  },

  // =======================================
  // --- Rutas del Área "Mi Cuenta" ---
  // =======================================
  {
    path: 'account',
    component: Account, // Este es el layout para la sección de cuenta
    canActivate: [LoginGuard], // El usuario debe estar logueado para acceder a CUALQUIER ruta hija
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' }, // Redirige /account a /account/orders
      { path: 'orders', component: MyOrdersComponent },
      { path: 'addresses', component: MyAddressesComponent },
      { path: 'details', component: MyDetailsComponent },
    ],
  },

  // ============================================
  // --- Rutas del Panel de Administración ---
  // ============================================
  {
    path: 'admin',
    component: AdminLayout,
    data: { animation: 'AdminPage' },
    canActivate: [AuthGuard], // ¡Aplicamos el guardia a la ruta padre!
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'products', component: AdminProductListComponent },
      { path: 'products/new', component: ProductForm },
      { path: 'products/edit/:id', component: ProductForm },
      { path: 'orders', component: OrderList },
      { path: 'orders/:id', component: OrderDetail },
      { path: 'invoice/:id', component: InvoiceViewComponent },
      { path: 'customers', component: CustomerList },
      { path: 'coupons', component: CouponList },
      { path: 'coupons/new', component: couponForm },
      { path: 'coupons/edit/:id', component: couponForm },
      { path: 'settings', component: settings },
      { path: 'categories', component: CategoryList },
      { path: 'categories/new', component: CategoryFormComponent },
      { path: 'categories/edit/:id', component: CategoryFormComponent },
      { path: 'variant-templates', component: VariantTemplatesComponent },
      { path: 'sections', component: SectionsComponent },
      { path: 'vendors', component: VendorsComponent },
      { path: 'special-events', component: SpecialEvents },
    ],
  },

  // (Opcional) Una ruta "catch-all" para redirigir al inicio si la URL no existe

  // { path: '**', redirectTo: '' }
];
