import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Product, Review, ProductsResponse, EnvConfig } from '@/types';

const PRODUCTS_FILE = path.join(process.cwd(), 'products.json');
const ENV_FILE = path.join(process.cwd(), '.env');

let products: Product[] = [];
let envConfig: EnvConfig = {
  allowedIPs: ['127.0.0.1', '::1'],
  rateLimitWindow: 60000,
  rateLimitMax: 100,
};

export function loadEnv(): void {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const envContent = fs.readFileSync(ENV_FILE, 'utf8');
      envContent.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (key.trim() === 'ALLOWED_IPS') {
            envConfig.allowedIPs = value.split(',').map((ip) => ip.trim());
          } else if (key.trim() === 'RATE_LIMIT_WINDOW') {
            envConfig.rateLimitWindow = parseInt(value) || 60000;
          } else if (key.trim() === 'RATE_LIMIT_MAX') {
            envConfig.rateLimitMax = parseInt(value) || 100;
          }
        }
      });
    }
  } catch (err) {
    console.log('Using default environment config');
  }
}

export function generateLinkId(title: string): string {
  const hash = crypto
    .createHash('md5')
    .update(title + Date.now())
    .digest('hex')
    .substring(0, 8);
  return hash;
}

export function loadProducts(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      const parsed = JSON.parse(data);

      products = parsed.products.map((product: Product, index: number) => {
        if (!product.linkId) {
          product.linkId = generateLinkId(product.title);
        }
        if (!product.tags) {
          product.tags = product.category ? [product.category] : [];
        }
        if (!product.reviews) {
          product.reviews = [];
        }
        if (!product.order) {
          product.order = index + 1;
        }
        if (!product.fullDescription) {
          product.fullDescription = product.description || '';
        }
        if (!product.specifications) {
          product.specifications = {};
        }
        return product;
      });

      products.sort((a, b) => a.order - b.order);
      saveProducts(products);
      console.log(`[${new Date().toISOString()}] Products loaded: ${products.length}`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error loading products:`, (err as Error).message);
    products = [];
  }
  return products;
}

export function saveProducts(data: Product[]): void {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify({ products: data }, null, 4));
}

export function getProducts(
  tag?: string,
  search?: string,
  sort?: string
): ProductsResponse {
  let filtered = [...products];

  if (tag) {
    filtered = filtered.filter((p) =>
      p.tags && p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchLower)))
    );
  }

  if (sort === 'price_asc') {
    filtered.sort(
      (a, b) =>
        parseFloat(a.price.replace(/[^0-9.]/g, '')) -
        parseFloat(b.price.replace(/[^0-9.]/g, ''))
    );
  } else if (sort === 'price_desc') {
    filtered.sort(
      (a, b) =>
        parseFloat(b.price.replace(/[^0-9.]/g, '')) -
        parseFloat(a.price.replace(/[^0-9.]/g, ''))
    );
  } else if (sort === 'rating') {
    filtered.sort((a, b) => getAverageRating(b) - getAverageRating(a));
  } else {
    filtered.sort((a, b) => a.order - b.order);
  }

  const tags = [...new Set(products.flatMap((p) => p.tags || []))];

  return {
    products: filtered,
    tags,
    total: filtered.length,
  };
}

export function getProductByLinkId(linkId: string): Product | undefined {
  return products.find((p) => p.linkId === linkId);
}

export function createProduct(productData: Partial<Product>): Product {
  const newProduct: Product = {
    id: String(products.length + 1),
    title: productData.title || '',
    description: productData.description || '',
    fullDescription: productData.fullDescription || productData.description || '',
    price: productData.price || '',
    category: productData.category || 'Other',
    tags: productData.tags || (productData.category ? [productData.category] : []),
    specifications: productData.specifications || {},
    thumbnail: productData.thumbnail || '',
    status: 'available',
    linkId: generateLinkId(productData.title || ''),
    reviews: [],
    order: products.length + 1,
  };

  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(linkId: string, updates: Partial<Product>): Product | null {
  const index = products.findIndex((p) => p.linkId === linkId);
  if (index === -1) return null;

  const { linkId: _, id: __, ...cleanUpdates } = updates as Record<string, unknown>;
  products[index] = { ...products[index], ...cleanUpdates };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(linkId: string): boolean {
  const index = products.findIndex((p) => p.linkId === linkId);
  if (index === -1) return false;

  products.splice(index, 1);
  saveProducts(products);
  return true;
}

export function addReview(linkId: string, review: Omit<Review, 'id'>): Review | null {
  const product = products.find((p) => p.linkId === linkId);
  if (!product) return null;

  const newReview: Review = {
    ...review,
    id: String((product.reviews?.length || 0) + 1),
  };

  if (!product.reviews) {
    product.reviews = [];
  }
  product.reviews.push(newReview);
  saveProducts(products);
  return newReview;
}

export function getAverageRating(product: Product): number {
  if (!product.reviews || product.reviews.length === 0) return 0;
  const sum = product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / product.reviews.length;
}

// Initialize on module load
loadEnv();
loadProducts();
