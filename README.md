# DevOriaxen

Digital Solutions Studio website.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Server runs at http://localhost:3000

## Features

- Products loaded from JSON with auto-generated link IDs
- Tag/category filtering and sorting
- Review system with star ratings
- Dynamic product detail pages
- Rate limiting and IP whitelisting
- File watching for automatic JSON reload
- Logging system

## API Endpoints

- `GET /api/products` - List all products (supports ?tag=, ?search=, ?sort=)
- `GET /api/products/:linkId` - Get single product
- `POST /api/products` - Add product
- `PUT /api/products/:linkId` - Update product
- `DELETE /api/products/:linkId` - Delete product
- `POST /api/products/:linkId/reviews` - Add review

## Configuration

Edit `.env` file:

```
ALLOWED_IPS=127.0.0.1,::1,0.0.0.0
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```
