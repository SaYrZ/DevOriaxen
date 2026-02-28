# DevOriaxen - Next.js Web Application

A modern, responsive Next.js website for DevOriaxen digital solutions studio with smooth animations and hover effects.

## Features

- 🎨 Modern dark theme design with gradient orbs and grid patterns
- ✨ Smooth animations and hover effects
- 📱 Fully responsive for mobile devices
- 🛒 Product catalog with search, filter, and tag functionality
- ⭐ Product ratings and reviews system
- 🔒 SEO optimized

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom CSS
- **Fonts:** Space Grotesk & Inter (Google Fonts)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── products/
│   │   │       ├── route.ts         # Get all products
│   │   │       └── [linkId]/
│   │   │           └── route.ts      # Get single product
│   │   ├── product/
│   │   │   └── [linkId]/
│   │   │       └── page.tsx         # Product detail page
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home page
│   ├── lib/
│   │   └── products.ts              # Product data utilities
│   └── types/
│       └── index.ts                  # TypeScript types
├── products.json                     # Product data
├── package.json
└── README.md
```

## Adding Products

Edit `products.json` to add or modify products:

```json
{
  "products": [
    {
      "id": "1",
      "linkId": "unique-id",
      "title": "Product Name",
      "category": "Category",
      "tags": ["tag1", "tag2"],
      "description": "Short description",
      "fullDescription": "Full description",
      "thumbnail": "image-url",
      "price": "$9.99/month",
      "status": "available",
      "order": 1,
      "specifications": {
        "Key": "Value"
      },
      "reviews": []
    }
  ]
}
```

## API Endpoints

- `GET /api/products` - Get all products (supports `tag`, `search`, `sort` query params)
- `GET /api/products/[linkId]` - Get single product by ID
- `POST /api/products/[linkId]/reviews` - Add review to product

## Building for Production

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

## Customization

- **Colors:** Modify CSS variables in `src/app/globals.css`
- **Fonts:** Update in `src/app/layout.tsx`
- **Products:** Edit `products.json`
