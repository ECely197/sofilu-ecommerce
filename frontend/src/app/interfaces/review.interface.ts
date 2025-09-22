export interface Review {
  _id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
}
