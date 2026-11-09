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
  onShareConv,
  onOpenModal,
  session,
  onSignOut,
  loading,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [projects, setProjects] = useState(["DSA Practice", "Web Development", "General Study"]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Filter conversations by search and selected project
  const filteredConvs = useMemo(() => {
    let result = convs || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => (c.title || "").toLowerCase().includes(q));
    }
    if (selectedProject) {
      result = result.filter((c) => (c.title || "").toLowerCase().includes(selectedProject.toLowerCase()));
    }
    return result;
  }, [convs, searchQuery, selectedProject]);

  const groups = useMemo(() => groupConversations(filteredConvs), [filteredConvs]);

  const userEmail = session?.user?.email || "";
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  const handleAddProject = () => {
    const name = prompt("Enter new Project name (e.g., Python Project, Semester Exam):");
    if (name && name.trim()) {
      setProjects([...projects, name.trim()]);
    }
  };

  return (
    <>
      {/* Scrim for mobile */}
      {open && (
        <div
          className="sidebar-scrim"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`} aria-label="Sidebar">
        {/* Brand Header with Search & Collapse Icons */}
        <div className="sidebar-brand" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              className="sidebar-brand-logo"
              src="/nexora-logo.png"
              alt="Nexora AI"
              onError={(e) => { e.target.src = "/logo.jpg"; }}
            />
            <span className="sidebar-brand-name grad-text">Nexora AI</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Search chats button */}
            <button
              className="sidebar-icon-btn"
              onClick={() => setSearchOpen((v) => !v)}
              title="Search conversations"
              aria-label="Search conversations"
            >
              🔍
            </button>
            {/* Collapse sidebar button */}
            <button
              className="sidebar-icon-btn"
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              ◨
            </button>
          </div>
        </div>

        {/* Live Search Input (Expands when 🔍 is clicked) */}
        {searchOpen && (
          <div style={{ padding: "0 10px 10px 10px" }}>
            <input
              type="text"
              className="share-link-input"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{ fontSize: 13, padding: "6px 10px", width: "100%" }}
            />
          </div>
        )}

        {/* ChatGPT Style Navigation Menu */}
        <div className="sidebar-nav-menu">
          {/* 1. New Chat */}
          <button
            className="sidebar-nav-item primary"
            onClick={() => { onNewChat(); onClose(); }}
            disabled={loading}
          >
            <span className="sidebar-nav-icon">📝</span>
            <span className="sidebar-nav-text">New chat</span>
          </button>

          {/* 2. Scheduled */}
          <button
            className="sidebar-nav-item"
            onClick={() => onOpenModal("scheduled")}
            type="button"
          >
            <span className="sidebar-nav-icon">🕒</span>
            <span className="sidebar-nav-text">Scheduled</span>
          </button>

          {/* 3. Library */}
          <button
            className="sidebar-nav-item"
            onClick={() => onOpenModal("library")}
            type="button"
          >
            <span className="sidebar-nav-icon">📚</span>
            <span className="sidebar-nav-text">Library</span>
          </button>

          {/* 4. Plugins */}
          <button
            className="sidebar-nav-item"
            onClick={() => onOpenModal("plugins")}
            type="button"
          >
            <span className="sidebar-nav-icon">🌀</span>
            <span className="sidebar-nav-text">Plugins</span>
          </button>

          {/* 5. Explore */}
          <button
            className="sidebar-nav-item"
            onClick={() => onOpenModal("explore")}
            type="button"
          >
            <span className="sidebar-nav-icon">⋯</span>
            <span className="sidebar-nav-text">Explore</span>
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Projects Folders Section */}
        <div className="sidebar-projects-section">
          <div className="sidebar-projects-header" onClick={() => setProjectsOpen((v) => !v)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>📁</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Projects {projectsOpen ? "▾" : "▸"}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <button
                className="sidebar-mini-btn"
                title="Create new project folder"
                onClick={handleAddProject}
              >
                +
              </button>
            </div>
          </div>

          {projectsOpen && (
            <div className="sidebar-projects-list">
              <div
                className={`sidebar-project-item ${selectedProject === null ? "active" : ""}`}
                onClick={() => setSelectedProject(null)}
              >
                <span>All Chats</span>
              </div>
              {projects.map((p) => (
                <div
                  key={p}
                  className={`sidebar-project-item ${selectedProject === p ? "active" : ""}`}
                  onClick={() => setSelectedProject(selectedProject === p ? null : p)}
                >
                  <span># {p}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* History Grouped List */}
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
                    {/* Share Button on conversation */}
                    <button
                      className="conv-action-btn"
                      onClick={(e) => { e.stopPropagation(); onShareConv(c); }}
                      title="Share chat"
                      aria-label="Share chat"
                    >
                      🔗
                    </button>
                    {/* Delete Button */}
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

        {/* User Footer */}
        <div className="sidebar-footer" style={{ position: "relative" }}>
          {userMenuOpen && (
            <div className="user-dropdown">
              <button
                className="user-dropdown-item"
                onClick={() => { setUserMenuOpen(false); onOpenModal("plugins"); }}
              >
                <span>⚙️</span> Settings & Plugins
              </button>
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
              <div className="user-plan">Nexora Pro</div>
            </div>
            <div className="user-menu-btn">⋯</div>
          </div>
        </div>
      </aside>
    </>
  );
}
