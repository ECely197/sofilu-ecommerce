// Contenido completo y final para: src/app/interfaces/product.interface.ts

// Importamos la interfaz Category para poder usarla como tipo
import { Category } from '../services/category.service';
import { Vendor } from '../services/vendor.service';

export interface Option {
  name: string;
  priceModifier: number;
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
  category: Category;

  images: string[];
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
  variants: Variant[];
}
