export interface Variant {
  name: string;
  options: { name: string }[];
}


export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string; // En el futuro será un objeto Category
  images: string[]; // <-- ¡CAMBIADO! Ahora es un array de strings
  variants: Variant[];
  isFeatured?: boolean; // Hacemos opcionales los campos nuevos
  isOnSale?: boolean;
  salePrice?: number;
}