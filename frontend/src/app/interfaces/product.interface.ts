export interface Product {
  _id: string; // MongoDB siempre crea una propiedad _id única.
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}