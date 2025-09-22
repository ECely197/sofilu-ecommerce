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
import { CategoryView } from './pages/category-view/category-view';
import { SearchResultsComponent } from './pages/search-results/search-results';

// Páginas de la Cuenta del Usuario (Rutas Hijas de 'Account')
import { MyOrdersComponent } from './pages/account/my-orders/my-orders';
import { MyAddressesComponent } from './pages/account/my-addresses/my-addresses';
import { MyDetailsComponent } from './pages/account/my-details/my-details';

// Páginas de Administración (Rutas Hijas de 'AdminLayout')
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { ProductList as AdminProductList } from './pages/admin/product-list/product-list'; // Alias para evitar colisión de nombres
import { ProductForm } from './pages/admin/product-form/product-form';
// ... (resto de importaciones de admin)

export const routes: Routes = [
  // ===================================
  // --- Rutas de la Tienda (Cliente) ---
  // ===================================
  { path: '', component: Home, data: { animation: 'HomePage' } },
  {
    path: 'category/:slug',
    component: CategoryView,
    data: { animation: 'CategoryPage' },
  },
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
    component: AdminLayout, // Layout principal del panel de admin (con sidebar, etc.)
    canActivate: [AuthGuard], // El usuario debe ser ADMIN para acceder a CUALQUIER ruta hija
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'products', component: AdminProductList },
      { path: 'products/new', component: ProductForm }, // Ruta para crear
      { path: 'products/edit/:id', component: ProductForm }, // Ruta para editar (reutiliza el mismo componente)
      // ... (resto de rutas de admin)
    ],
  },

  // --- Ruta Wildcard (Atrapa-todo) ---
  // Se recomienda descomentar para redirigir URLs no encontradas a la página de inicio.
  // { path: '**', redirectTo: '' }
];
