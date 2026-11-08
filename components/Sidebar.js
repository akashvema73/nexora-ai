"use client";
import { useState, useMemo } from "react";

const MODE_COLORS = {
  coding: "var(--mode-coding)",
  study: "var(--mode-study)",
  general: "var(--mode-general)",
  creative: "var(--mode-creative)",
};

function groupConversations(convs) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOf7Days = new Date(startOfToday);
  startOf7Days.setDate(startOf7Days.getDate() - 7);

  const startOf30Days = new Date(startOfToday);
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const groups = {
    today: [],
    yesterday: [],
    last7: [],
    last30: [],
    older: [],
  };

  for (const c of convs) {
    const d = new Date(c.updated_at);
    if (d >= startOfToday) groups.today.push(c);
    else if (d >= startOfYesterday) groups.yesterday.push(c);
    else if (d >= startOf7Days) groups.last7.push(c);
    else if (d >= startOf30Days) groups.last30.push(c);
    else groups.older.push(c);
  }

  return [
    { label: "Today", items: groups.today },
    { label: "Yesterday", items: groups.yesterday },
    { label: "Previous 7 Days", items: groups.last7 },
    { label: "Previous 30 Days", items: groups.last30 },
    { label: "Older", items: groups.older },
  ].filter((g) => g.items.length > 0);
}

export default function Sidebar({
  open,
  onClose,
  convs,
  activeId,
  onNewChat,
  onOpenConv,
  onDeleteConv,
  session,
  onSignOut,
  loading,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const groups = useMemo(() => groupConversations(convs), [convs]);

  const userEmail = session?.user?.email || "";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          className="sidebar-scrim"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`} aria-label="Sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <img
            className="sidebar-brand-logo"
            src="/nexora-logo.png"
            alt="Nexora AI"
            onError={(e) => { e.target.src = "/logo.jpg"; }}
          />
          <span className="sidebar-brand-name grad-text">Nexora AI</span>
        </div>

        {/* New Chat */}
        <button
          className="btn-new-chat"
          onClick={() => { onNewChat(); onClose(); }}
          disabled={loading}
        >
          <span className="btn-new-chat-icon">+</span>
          New Chat
        </button>

        {/* History */}
        <nav className="sidebar-history" aria-label="Chat history">
          {convs.length === 0 && (
            <p className="muted small" style={{ padding: "8px 10px" }}>
              No conversations yet. Start a new chat!
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map((c) => (
                <div
                  key={c.id}
                  className={`conv-item${c.id === activeId ? " active" : ""}`}
                  onClick={() => { onOpenConv(c); onClose(); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { onOpenConv(c); onClose(); } }}
                >
                  <span
                    className={`conv-dot ${c.mode || "general"}`}
                    style={{ background: MODE_COLORS[c.mode] || undefined }}
                  />
                  <span className="conv-title" title={c.title}>{c.title}</span>
                  <div className="conv-actions">
                    <button
                      className="conv-action-btn"
                      onClick={(e) => { e.stopPropagation(); onDeleteConv(c.id); }}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ position: "relative" }}>
          {userMenuOpen && (
            <div className="user-dropdown">
              <button
                className="user-dropdown-item danger"
                onClick={() => { setUserMenuOpen(false); onSignOut(); }}
              >
                <span>🚪</span> Sign out
              </button>
            </div>
          )}
          <div
            className="sidebar-user"
            onClick={() => setUserMenuOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") setUserMenuOpen((v) => !v); }}
            aria-label="User menu"
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-email">{userEmail}</div>
              <div className="user-plan">Free Plan</div>
            </div>
            <div className="user-menu-btn">⋯</div>
          </div>
        </div>
      </aside>
    </>
  );
}
