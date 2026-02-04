// Contenido completo y final para: src/app/interfaces/product.interface.ts

import { Category } from '../services/category.service';
import { Vendor } from '../services/vendor.service';

/**
 * @interface Option
 * @description Define la estructura para una opción dentro de una variante.
 * Se añade el campo de imagen opcional. `price` y `stock` se mantienen como
 * números para consistencia en la aplicación, con un valor por defecto de 0.
 */
export interface Option {
  name: string;
  image?: string; // ¡NUEVO! Campo de imagen opcional
  price: number; // CORRECCIÓN: Se mantiene como `number`
  stock: number; // CORRECCIÓN: Se mantiene como `number`
  costPrice?: number; // Este puede seguir siendo opcional
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
  categories: Category[];
  images: string[];
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
  status: 'Activo' | 'Agotado';
  warrantyType?: any;
  variants: Variant[];
}
