"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0f0f0f;
          color: #fff;
          min-height: 100vh;
        }
        .admin-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
        }
        .admin-login-box {
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 3rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .admin-login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .admin-login-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          background: #6366f1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-login-icon svg {
          width: 32px;
          height: 32px;
          fill: white;
        }
        .admin-login-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .admin-login-subtitle {
          color: #888;
          font-size: 0.875rem;
        }
        .admin-form-group {
          margin-bottom: 1.5rem;
        }
        .admin-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #aaa;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .admin-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0f0f0f;
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .admin-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .admin-input::placeholder {
          color: #555;
        }
        .admin-btn {
          width: 100%;
          padding: 0.875rem;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .admin-btn:hover:not(:disabled) {
          background: #5558e3;
        }
        .admin-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .admin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .admin-back-link {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          color: #888;
          text-decoration: none;
          font-size: 0.875rem;
        }
        .admin-back-link:hover {
          color: #aaa;
        }
      `}</style>

      <div className="admin-login-container">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <div className="admin-login-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <h1 className="admin-login-title">Admin Login</h1>
            <p className="admin-login-subtitle">Enter your credentials to access the dashboard</p>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="admin-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="admin-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <a href="/" className="admin-back-link">
            Back to Home
          </a>
        </div>
      </div>
    </>
  );
}
