export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  date: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  price: string;
  category: string;
  tags: string[];
  specifications: Record<string, string>;
  thumbnail: string;
  status: string;
  linkId: string;
  reviews: Review[];
  order: number;
}

export interface ProductsResponse {
  products: Product[];
  tags: string[];
  total: number;
}

export interface EnvConfig {
  allowedIPs: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}
