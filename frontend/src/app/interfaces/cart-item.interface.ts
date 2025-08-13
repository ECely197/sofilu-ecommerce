import { Product } from './product.interface';

export interface CartItem {
  id: string;

  product: Product;
  quantity: number;

  selectedVariants: { [key: string]: string };
}
