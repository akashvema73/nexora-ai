"use client";
import { useRef, useState, useEffect } from "react";

const TOOLS = [
  {
    id: "file",
    icon: "📎",
    label: "Attach file",
    desc: "Images, PDFs, text files",
  },
  {
    id: "websearch",
    icon: "🌐",
    label: "Web Search",
    desc: "Search the live web",
    toggle: true,
  },
  {
    id: "image",
    icon: "🎨",
    label: "Create Image",
    desc: "AI image generation",
    comingSoon: true,
  },
];

export default function Composer({
  input,
  setInput,
  onSend,
  loading,
  mode,
  webSearch,
  setWebSearch,
  selectedFile,
  setSelectedFile,
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const toolsRef = useRef(null);

  // Auto-resize textarea
  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleSend() {
    onSend();
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
    setToolsOpen(false);
  }

  // Close tools popup on outside click
  useEffect(() => {
    if (!toolsOpen) return;
    const handler = (e) => {
      if (!toolsRef.current?.contains(e.target)) setToolsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolsOpen]);

  const getPlaceholder = () => {
    if (mode === "coding") return "Paste your code or describe a programming task…";
    if (mode === "study")  return "Ask me to explain a concept, quiz you, or make notes…";
    if (mode === "creative") return "Tell me what you want to write, brainstorm, or create…";
    return "Ask anything…";
  };

  const canSend = !loading && input.trim().length > 0;

  return (
    <footer className="composer-wrap">
      <div className="composer-inner">
        {/* Chips row */}
        {(selectedFile || webSearch) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {selectedFile && (
              <div className="file-chip">
                <span className="file-chip-icon">
                  {selectedFile.type.startsWith("image/") ? "🖼️" : "📄"}
                </span>
                <span className="file-chip-name">{selectedFile.name}</span>
                <button
                  className="file-chip-remove"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            )}
            {webSearch && (
              <div className="web-search-pill">
                <span>🌐</span>
                <span style={{ fontWeight: 500 }}>Web Search ON</span>
                <button
                  className="web-search-pill-remove"
                  onClick={() => setWebSearch(false)}
                  aria-label="Disable web search"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="composer-box" ref={toolsRef}>
          {/* Tools button + popup */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              className={`composer-tools-btn${toolsOpen ? " active" : ""}`}
              onClick={() => setToolsOpen((v) => !v)}
              aria-label="Open tools menu"
              aria-expanded={toolsOpen}
              type="button"
            >
              +
            </button>

            {toolsOpen && (
              <div className="tools-popup">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    className="tool-item"
                    type="button"
                    onClick={() => {
                      if (tool.id === "file") { fileRef.current?.click(); }
                      else if (tool.id === "websearch") {
                        setWebSearch((v) => !v);
                        setToolsOpen(false);
                      } else if (tool.comingSoon) {
                        alert("Coming soon! This feature is in development.");
                        setToolsOpen(false);
                      }
                    }}
                  >
                    <span className="tool-item-icon">{tool.icon}</span>
                    <span>
                      <span className="tool-item-label">{tool.label}</span>
                      <span className="tool-item-desc">{tool.desc}</span>
                    </span>
                    {tool.toggle && (
                      <span className={`tool-item-badge${webSearch ? " on" : ""}`}>
                        {tool.id === "websearch" && webSearch ? "ON" : ""}
                      </span>
                    )}
                    {tool.comingSoon && (
                      <span className="tool-item-badge">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md"
            hidden
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <textarea
            ref={taRef}
            className="composer-textarea"
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder={getPlaceholder()}
            disabled={loading}
          />

          {/* Send button */}
          <button
            className={`composer-send-btn${loading ? " loading" : ""}`}
            onClick={handleSend}
            disabled={!canSend}
            aria-label={loading ? "Generating…" : "Send message"}
            type="button"
          >
            {loading ? "⟳" : "↑"}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="composer-hint">
          Press <kbd style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 5px", fontSize: 11 }}>Enter</kbd> to send,{" "}
          <kbd style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 5px", fontSize: 11 }}>Shift+Enter</kbd> for new line.
          Nexora AI can make mistakes — verify important information.
        </p>
      </div>
    </footer>
  );
}
