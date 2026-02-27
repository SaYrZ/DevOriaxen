import { NextRequest, NextResponse } from 'next/server';
import {
  getProducts,
  createProduct,
  loadProducts,
} from '@/lib/products';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tag = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || undefined;

  const result = getProducts(tag, search, sort);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, fullDescription, price, category, tags, specifications, thumbnail } = body;

    if (!title || !price) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    const newProduct = createProduct({
      title,
      description,
      fullDescription,
      price,
      category,
      tags,
      specifications,
      thumbnail,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
