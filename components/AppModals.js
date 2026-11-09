"use client";
import { useState, useEffect } from "react";

// ── 1. Scheduled Assistant Modal ──────────────────────────────
export function ScheduledModal({ open, onClose, onScheduleTask }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Daily Coding Challenge", time: "Everyday at 09:00 AM", mode: "Coding", active: true },
    { id: 2, title: "Study Quiz & Summary", time: "Mon, Wed, Fri at 07:00 PM", mode: "Study", active: true },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  if (!open) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTitle.trim(),
      time: newTime || "Daily at 10:00 AM",
      mode: "General",
      active: true,
    };
    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewTime("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🕒</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Scheduled Routines & Tasks</h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Automate study sessions, daily coding quizzes, and reminders.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            className="share-link-input"
            placeholder="Add new schedule (e.g., Python DSA practice)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
            + Add
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, maxHeight: 260, overflowY: "auto" }}>
          {tasks.map((t) => (
            <div key={t.id} className="tool-item" style={{ justifyContent: "space-between", padding: "10px 14px", background: "var(--panel2)", borderRadius: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.time} • {t.mode} mode</div>
              </div>
              <button
                className={`tool-item-badge ${t.active ? "on" : ""}`}
                style={{ cursor: "pointer", border: "none" }}
                onClick={() => toggleTask(t.id)}
              >
                {t.active ? "Active" : "Paused"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. Library & Bookmarks Modal ─────────────────────────────
export function LibraryModal({ open, onClose, onUsePrompt }) {
  const [savedItems, setSavedItems] = useState([
    { id: 1, title: "Clean React Component Boilerplate", tag: "Code", text: "Create a production-ready React 18 component with clean hooks, accessible ARIA attributes, and error boundaries." },
    { id: 2, title: "Socratic Method Explanation", tag: "Study", text: "Explain how recursion works in computer science using the Socratic method with real-world analogies." },
    { id: 3, title: "System Design Framework", tag: "Architecture", text: "Give me a step-by-step framework to design high-throughput distributed systems like URL shorteners and chat apps." },
  ]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Library & Saved Prompts</h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Access saved knowledge templates, code snippets, and study notes.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, maxHeight: 320, overflowY: "auto" }}>
          {savedItems.map((item) => (
            <div key={item.id} style={{ background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
                <span className="file-chip" style={{ fontSize: 11, padding: "2px 8px" }}>{item.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10, lineHeight: 1.5 }}>
                {item.text}
              </p>
              <button
                className="btn-primary"
                style={{ padding: "5px 12px", fontSize: 12 }}
                onClick={() => { onUsePrompt(item.text); onClose(); }}
              >
                Use in Chat ↗
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 3. Plugins & Tools Modal ─────────────────────────────────
export function PluginsModal({ open, onClose, webSearch, setWebSearch, voiceMode, setVoiceMode }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌀</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Nexora AI Plugins & Superpowers</h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Extend AI capabilities with real-time web tools, voice, and analysis.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {/* Plugin 1: Web Search */}
          <div className="tool-item" style={{ background: "var(--panel2)", borderRadius: 10, padding: 12 }}>
            <span className="tool-item-icon" style={{ fontSize: 24 }}>🌐</span>
            <div style={{ flex: 1 }}>
              <div className="tool-item-label" style={{ fontSize: 14 }}>Live Google Search</div>
              <div className="tool-item-desc">Browse real-time web news, live docs, and current information.</div>
            </div>
            <button
              className={`tool-item-badge ${webSearch ? "on" : ""}`}
              style={{ cursor: "pointer", border: "none" }}
              onClick={() => setWebSearch((v) => !v)}
            >
              {webSearch ? "ENABLED" : "ENABLE"}
            </button>
          </div>

          {/* Plugin 2: Voice Assistant */}
          <div className="tool-item" style={{ background: "var(--panel2)", borderRadius: 10, padding: 12 }}>
            <span className="tool-item-icon" style={{ fontSize: 24 }}>🎙️</span>
            <div style={{ flex: 1 }}>
              <div className="tool-item-label" style={{ fontSize: 14 }}>Voice Assistant & Readout</div>
              <div className="tool-item-desc">Speech-to-text mic input with real-time audio playback.</div>
            </div>
            <button
              className={`tool-item-badge ${voiceMode ? "on" : ""}`}
              style={{ cursor: "pointer", border: "none" }}
              onClick={() => setVoiceMode((v) => !v)}
            >
              {voiceMode ? "ENABLED" : "ENABLE"}
            </button>
          </div>

          {/* Plugin 3: File & Vision Analyzer */}
          <div className="tool-item" style={{ background: "var(--panel2)", borderRadius: 10, padding: 12 }}>
            <span className="tool-item-icon" style={{ fontSize: 24 }}>📎</span>
            <div style={{ flex: 1 }}>
              <div className="tool-item-label" style={{ fontSize: 14 }}>Document & Image Vision</div>
              <div className="tool-item-desc">Analyze code files, PDFs, text documents, and images.</div>
            </div>
            <span className="tool-item-badge on">READY</span>
          </div>

          {/* Plugin 4: Code Sandbox & Debugger */}
          <div className="tool-item" style={{ background: "var(--panel2)", borderRadius: 10, padding: 12 }}>
            <span className="tool-item-icon" style={{ fontSize: 24 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div className="tool-item-label" style={{ fontSize: 14 }}>Code Sandbox & Synthesizer</div>
              <div className="tool-item-desc">Interactive syntax highlighting with 1-click copy block support.</div>
            </div>
            <span className="tool-item-badge on">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Explore Modes & Personas Modal ─────────────────────────
export function ExploreModal({ open, onClose, onSelectMode }) {
  if (!open) return null;

  const MODES_LIST = [
    { id: "coding", icon: "💻", title: "Coding & Engineering", desc: "Full-stack code generation, debugging, refactoring, and architectural advice.", tag: "Popular" },
    { id: "study", icon: "📚", title: "Study & Exam Tutor", desc: "Deep explanations, interactive flash quizzes, revision summaries, and memorization aids.", tag: "Education" },
    { id: "creative", icon: "🎨", title: "Creative & Brainstorming", desc: "Story crafting, marketing copy, content ideation, and screenwriting.", tag: "Writing" },
    { id: "general", icon: "🌐", title: "General Assistant", desc: "Quick everyday queries, structured research, summaries, and calculations.", tag: "Daily" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⋯</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Explore Nexora AI Personas</h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Choose a specialized AI mode customized for your task.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {MODES_LIST.map((m) => (
            <div
              key={m.id}
              onClick={() => { onSelectMode(m.id); onClose(); }}
              style={{
                background: "var(--panel2)",
                border: "1px solid var(--line2)",
                borderRadius: 12,
                padding: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="suggestion-card"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <span className="file-chip" style={{ fontSize: 10, padding: "2px 6px" }}>{m.tag}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.title}</div>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
