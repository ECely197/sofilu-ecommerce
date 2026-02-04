import { Category } from '../services/category.service';
import { Vendor } from '../services/vendor.service';

/**
 * @interface Option
 * @description Define la estructura para una opción dentro de una variante.
 */
export interface Option {
  name: string;
  image?: string;
  price: number;
  stock: number;
  costPrice?: number;
}

export interface Variant {
  name: string;
  options: Option[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  sku?: string;
  vendor?: Vendor;
  price: number;
  costPrice?: number;
  stock: number;

  // Soporte para ambas estructuras durante la migración
  category?: Category; // <--- DEPRECADO (Legacy)
  categories?: Category[]; // <--- NUEVO (Array)

  images: string[];
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
  status: 'Activo' | 'Agotado';
  variants: Variant[];

  // --- CAMPO NUEVO ---
  warrantyType?: any; // Puede ser string (ID) o objeto (WarrantyType)
}
