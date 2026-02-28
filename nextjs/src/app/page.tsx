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
            <svg width="16" height="16" viewBox="0 0 24 24" fill={i < fullStars || (i === fullStars && hasHalf) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
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

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    discord: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      setSuccess(true);
      setFormData({ name: "", email: "", discord: "", message: "" });
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="contact-success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h3>Message Sent!</h3>
        <p>We'll get back to you as soon as possible.</p>
        <button
          className="btn btn-primary"
          onClick={() => setSuccess(false)}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {error && <div className="contact-error">{error}</div>}
      <div className="contact-field">
        <input
          type="text"
          placeholder="Your Name *"
          className="contact-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={100}
        />
      </div>
      <div className="contact-field">
        <input
          type="email"
          placeholder="Email Address *"
          className="contact-input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="contact-field">
        <input
          type="text"
          placeholder="Discord (optional)"
          className="contact-input"
          value={formData.discord}
          onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
          maxLength={100}
        />
      </div>
      <div className="contact-field">
        <textarea
          placeholder="Your Message *"
          className="contact-input contact-textarea"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          maxLength={5000}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? (
          <>
            <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"/>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send Message
          </>
        )}
      </button>
    </form>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
  }, [selectedTag, search, sort]);

  useEffect(() => {
    // Intersection Observer for card animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll(".product-card, .feature-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [products]);

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
      {/* Noise overlay */}
      <div className="noise" aria-hidden="true"></div>

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
          <button className="mobile-toggle" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Premium Digital Solutions</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-gradient">Build Better with</span>
            <br />
            <span className="hero-title-accent">DevOriaxen</span>
          </h1>
          <p className="hero-subtitle">
            We craft powerful Discord bots, web applications, and digital tools designed for performance, reliability, and seamless integration into your workflow.
          </p>
          <div className="hero-buttons">
            <a href="#products" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              View Products
            </a>
            <a href="#features" className="btn btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Our Products</span>
            <h2 className="section-title">Digital Solutions for Every Need</h2>
            <p className="section-desc">
              Explore our collection of premium products built to elevate your projects and communities.
            </p>
          </div>

          {/* Search and Filter */}
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

          {/* Tags */}
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
              {products.map((product, index) => (
                <Link
                  key={product.linkId}
                  id={`product-${index}`}
                  href={`/product/${product.linkId}`}
                  className={`product-card ${visibleCards.has(`product-${index}`) ? "visible" : ""}`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="product-thumbnail-wrap">
                    <img
                      src={
                        product.thumbnail ||
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop"
                      }
                      alt={product.title}
                      className="product-thumbnail"
                    />
                    <div className="product-overlay"></div>
                  </div>
                  <div className="product-content">
                    <span className="product-category">{product.category}</span>
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-meta">
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Why Choose Us</span>
            <h2 className="section-title">Built for Excellence</h2>
            <p className="section-desc">
              Every product is crafted with attention to detail and built to modern standards.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card visible">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-desc">
                Optimized for performance with minimal resource usage and instant response times for the best experience.
              </p>
            </div>
            <div className="feature-card visible" style={{ transitionDelay: "0.1s" }}>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="feature-title">Secure by Default</h3>
              <p className="feature-desc">
                Security-first approach with encrypted data handling and protected endpoints for peace of mind.
              </p>
            </div>
            <div className="feature-card visible" style={{ transitionDelay: "0.2s" }}>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <h3 className="feature-title">Easy Setup</h3>
              <p className="feature-desc">
                Simple installation process with comprehensive documentation and dedicated support included.
              </p>
            </div>
            <div className="feature-card visible" style={{ transitionDelay: "0.3s" }}>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h3 className="feature-title">Modular Design</h3>
              <p className="feature-desc">
                Flexible architecture that scales with your needs and integrates seamlessly with existing systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section cta-section">
        <div className="section-inner">
          <div className="cta-content">
            <h2 className="cta-title">Need a Custom Solution?</h2>
            <p className="cta-desc">
              We build custom Discord bots and web applications tailored to your specific requirements. Let's discuss your project.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">DevOriaxen</span>
          </div>
          <div className="footer-links">
            <a href="#products" className="footer-link">Products</a>
            <a href="#features" className="footer-link">Features</a>
            <a href="#contact" className="footer-link">Contact</a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} DevOriaxen. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
