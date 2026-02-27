"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product, ProductsResponse } from "@/types";

function StarRating({
  rating,
  showCount = false,
  count = 0,
}: {
  rating: number;
  showCount?: boolean;
  count?: number;
}) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="product-rating">
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`star ${i < fullStars || (i === fullStars && hasHalf) ? "filled" : ""}`}
          >
            {i < fullStars || (i === fullStars && hasHalf) ? "★" : "☆"}
          </span>
        ))}
      </div>
      {showCount && (
        <span className="review-count">
          {rating.toFixed(1)} ({count} review{count !== 1 ? "s" : ""})
        </span>
      )}
    </div>
  );
}

function getAverageRating(product: Product): number {
  if (!product.reviews || product.reviews.length === 0) return 0;
  const sum = product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / product.reviews.length;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedTag, search, sort]);

  async function fetchProducts() {
    try {
      const params = new URLSearchParams();
      if (selectedTag) params.set("tag", selectedTag);
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await res.json();
      setProducts(data.products);
      setTags(data.tags);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <span>DevOriaxen</span>
          </Link>
          <div className="nav-links">
            <a href="#products" className="nav-link">
              Products
            </a>
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>
          </div>
          <a href="#products" className="btn btn-primary">
            Browse Products
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">★ Premium Digital Solutions</div>
        <h1 className="hero-title">
          Powerful Bots & <span>Digital Tools</span>
        </h1>
        <p className="hero-subtitle">
          We craft powerful Discord bots, web applications, and digital tools
          designed for performance and reliability. Transform your Discord
          community today.
        </p>
        <div className="hero-buttons">
          <a href="#products" className="btn btn-primary">
            View Products
          </a>
          <a href="#features" className="btn btn-secondary">
            Learn More
          </a>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products-section">
        <div className="section-header">
          <h2 className="section-title">Our Products</h2>
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Sort by: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="tags-list">
            <button
              className={`tag ${selectedTag === "" ? "active" : ""}`}
              onClick={() => setSelectedTag("")}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`tag ${selectedTag === tag ? "active" : ""}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="empty-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <Link
                key={product.linkId}
                href={`/product/${product.linkId}`}
                className="product-card"
              >
                <div className="product-image-wrap">
                  <img
                    src={
                      product.thumbnail ||
                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop"
                    }
                    alt={product.title}
                    className="product-image"
                  />
                  <span className="product-badge">{product.status}</span>
                </div>
                <div className="product-content">
                  <div className="product-tags">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="product-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <StarRating
                      rating={getAverageRating(product)}
                      showCount
                      count={product.reviews?.length || 0}
                    />
                    <span className="product-price">{product.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title" style={{ textAlign: "center", marginBottom: "2rem" }}>
          Why Choose DevOriaxen?
        </h2>
        <div className="features-grid">
          <div className="feature-card animate-fade-in animate-delay-1">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-desc">
              Optimized for performance with minimal latency and maximum efficiency.
            </p>
          </div>
          <div className="feature-card animate-fade-in animate-delay-2">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Secure & Reliable</h3>
            <p className="feature-desc">
              Enterprise-grade security with 99.9% uptime guarantee.
            </p>
          </div>
          <div className="feature-card animate-fade-in animate-delay-3">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Easy Integration</h3>
            <p className="feature-desc">
              Simple setup process with comprehensive documentation.
            </p>
          </div>
          <div className="feature-card animate-fade-in animate-delay-4">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">24/7 Support</h3>
            <p className="feature-desc">
              Dedicated support team ready to help you anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <p>&copy; {new Date().getFullYear()} DevOriaxen. All rights reserved.</p>
      </footer>
    </>
  );
}
