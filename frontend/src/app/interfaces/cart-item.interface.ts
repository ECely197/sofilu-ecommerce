import { Product } from "./product.interface";

export interface CartItem {
  product: Product;
  quantity: number;
}