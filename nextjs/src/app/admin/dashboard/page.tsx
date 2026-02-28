"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  discord?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        setAuthenticated(true);
        loadMessages();
      } else {
        setAuthenticated(false);
        router.push("/admin/login");
      }
    } catch {
      setAuthenticated(false);
      router.push("/admin/login");
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "read" }),
      });
      loadMessages();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" }),
      });
      setSelectedMessage(null);
      loadMessages();
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading || authenticated === null) {
    return (
      <>
        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f0f; color: #fff; }
          .loading-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .loading { color: #888; }
        `}</style>
        <div className="loading-container">
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f0f; color: #fff; }
        .admin-layout { display: flex; min-height: 100vh; }
        .sidebar { width: 260px; background: #1a1a2e; border-right: 1px solid #333; padding: 1.5rem; display: flex; flex-direction: column; }
        .sidebar-header { margin-bottom: 2rem; }
        .sidebar-logo { font-size: 1.25rem; font-weight: 700; color: #fff; }
        .sidebar-subtitle { font-size: 0.75rem; color: #888; margin-top: 0.25rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; color: #aaa; text-decoration: none; transition: all 0.2s; margin-bottom: 0.5rem; }
        .nav-item:hover { background: #252540; color: #fff; }
        .nav-item.active { background: #6366f1; color: #fff; }
        .nav-item svg { width: 20px; height: 20px; }
        .sidebar-footer { margin-top: auto; }
        .logout-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; color: #aaa; background: none; border: none; cursor: pointer; font-size: 1rem; width: 100%; transition: all 0.2s; }
        .logout-btn:hover { background: #252540; color: #ef4444; }
        .main-content { flex: 1; padding: 2rem; overflow-y: auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .page-title { font-size: 1.5rem; font-weight: 600; }
        .message-count { background: #6366f1; color: #fff; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; margin-left: 0.75rem; }
        .messages-container { display: grid; gap: 1rem; }
        .message-card { background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; }
        .message-card:hover { border-color: #6366f1; }
        .message-card.unread { border-left: 3px solid #6366f1; }
        .message-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .message-name { font-weight: 600; color: #fff; }
        .message-date { font-size: 0.75rem; color: #888; }
        .message-preview { color: #aaa; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .message-meta { display: flex; gap: 1rem; margin-top: 0.75rem; }
        .message-email, .message-discord { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #888; }
        .message-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
        .modal-content { background: #1a1a2e; border: 1px solid #333; border-radius: 16px; width: 100%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #333; }
        .modal-title { font-size: 1.25rem; font-weight: 600; }
        .modal-close { background: none; border: none; color: #888; cursor: pointer; padding: 0.5rem; }
        .modal-close:hover { color: #fff; }
        .modal-body { padding: 1.5rem; }
        .modal-field { margin-bottom: 1.25rem; }
        .modal-label { display: block; font-size: 0.75rem; color: #888; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-value { color: #fff; font-size: 1rem; }
        .modal-message { background: #0f0f0f; padding: 1rem; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; }
        .modal-actions { display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid #333; }
        .modal-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .modal-btn.primary { background: #6366f1; border: none; color: #fff; }
        .modal-btn.primary:hover { background: #5558e3; }
        .modal-btn.danger { background: transparent; border: 1px solid #ef4444; color: #ef4444; }
        .modal-btn.danger:hover { background: rgba(239, 68, 68, 0.1); }
        .empty-state { text-align: center; padding: 4rem 2rem; color: #888; }
        .empty-icon { width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.5; }
      `}</style>

      <div className="admin-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">DevOriaxen</div>
            <div className="sidebar-subtitle">Admin Dashboard</div>
          </div>

          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
            Messages
          </a>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">
              Contact Messages
              {messages.filter(m => !m.read).length > 0 && (
                <span className="message-count">
                  {messages.filter(m => !m.read).length} new
                </span>
              )}
            </h1>
          </div>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                </svg>
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-card ${!msg.read ? "unread" : ""}`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.read) markAsRead(msg.id);
                  }}
                >
                  <div className="message-header">
                    <span className="message-name">{msg.name}</span>
                    <span className="message-date">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="message-preview">{msg.message}</p>
                  <div className="message-meta">
                    <span className="message-email">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                      </svg>
                      {msg.email}
                    </span>
                    {msg.discord && (
                      <span className="message-discord">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        {msg.discord}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {selectedMessage && (
        <div className="message-modal" onClick={() => setSelectedMessage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Message Details</h2>
              <button className="modal-close" onClick={() => setSelectedMessage(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <span className="modal-label">Name</span>
                <div className="modal-value">{selectedMessage.name}</div>
              </div>
              <div className="modal-field">
                <span className="modal-label">Email</span>
                <div className="modal-value">{selectedMessage.email}</div>
              </div>
              {selectedMessage.discord && (
                <div className="modal-field">
                  <span className="modal-label">Discord</span>
                  <div className="modal-value">{selectedMessage.discord}</div>
                </div>
              )}
              <div className="modal-field">
                <span className="modal-label">Date</span>
                <div className="modal-value">{formatDate(selectedMessage.createdAt)}</div>
              </div>
              <div className="modal-field">
                <span className="modal-label">Message</span>
                <div className="modal-message">{selectedMessage.message}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn danger" onClick={() => deleteMessage(selectedMessage.id)}>
                Delete
              </button>
              <button className="modal-btn primary" onClick={() => setSelectedMessage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
