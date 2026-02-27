"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Product, Review } from "@/types";

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
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
  );
}

function getAverageRating(product: Product): number {
  if (!product.reviews || product.reviews.length === 0) return 0;
  const sum = product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / product.reviews.length;
}

export default function ProductPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewerName: "",
    rating: 5,
    reviewText: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${linkId}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [linkId]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm.reviewerName || !reviewForm.reviewText) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${linkId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        const newReview = await res.json();
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                reviews: [...prev.reviews, newReview],
              }
            : null
        );
        setReviewForm({ reviewerName: "", rating: 5, reviewText: "" });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="logo">
              <span>DevOriaxen</span>
            </Link>
          </div>
        </nav>
        <div className="empty-state">Loading product...</div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="logo">
              <span>DevOriaxen</span>
            </Link>
          </div>
        </nav>
        <div className="empty-state">Product not found</div>
      </>
    );
  }

  const avgRating = getAverageRating(product);
  const reviewCount = product.reviews?.length || 0;

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <span>DevOriaxen</span>
          </Link>
          <div className="nav-links">
            <a href="/#products" className="nav-link">
              Products
            </a>
            <a href="/#features" className="nav-link">
              Features
            </a>
            <a href="/#contact" className="nav-link">
              Contact
            </a>
          </div>
          <a href="/#products" className="btn btn-primary">
            Browse Products
          </a>
        </div>
      </nav>

      <div className="product-detail">
        <Link href="/#products" className="back-link">
          ← Back to Products
        </Link>

        <div className="product-header">
          <div className="product-image-wrap">
            <img
              src={
                product.thumbnail ||
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop"
              }
              alt={product.title}
              className="product-image"
            />
          </div>
          <div className="product-info">
            <div className="product-tags">
              {product.tags?.map((tag) => (
                <span key={tag} className="product-tag">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="product-title">{product.title}</h1>
            <div className="product-rating">
              <StarRating rating={avgRating} />
              <span className="review-count">
                {avgRating.toFixed(1)} ({reviewCount} review
                {reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="product-price">{product.price}</div>
            <p className="product-desc">
              {product.fullDescription || product.description}
            </p>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="product-section">
            <h2 className="section-title">Specifications</h2>
            <div className="specs-grid">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="spec-item">
                  <span className="spec-key">{key}</span>
                  <span className="spec-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="product-section">
          <h2 className="section-title">Reviews</h2>
          <div className="reviews-list">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{review.reviewerName}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <div className="review-rating">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="review-text">{review.reviewText}</p>
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet.</p>
            )}
          </div>

          {/* Add Review Form */}
          <div className="review-form" style={{ marginTop: "2rem" }}>
            <h3 className="section-title">Add a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Your name"
                  className="search-input"
                  value={reviewForm.reviewerName}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, reviewerName: e.target.value })
                  }
                  required
                />
                <select
                  className="filter-select"
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
                  }
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Your review..."
                  className="search-input"
                  rows={4}
                  value={reviewForm.reviewText}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, reviewText: e.target.value })
                  }
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
