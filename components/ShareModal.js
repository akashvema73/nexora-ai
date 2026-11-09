"use client";
import { useState, useCallback } from "react";

export default function ShareModal({ open, onClose, conversation, messages }) {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!open) return null;

  const title = conversation?.title || "Nexora AI Conversation";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?chat=${conversation?.id || "shared"}`
    : "";

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleCopyFullText = async () => {
    try {
      const formatted = (messages || [])
        .map((m) => `${m.role === "user" ? "User" : "Nexora AI"}:\n${m.content}\n`)
        .join("\n---\n\n");
      const textToCopy = `# ${title}\n\n${formatted}\n\nShared via Nexora AI`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out this conversation with Nexora AI: "${title}"`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this conversation on Nexora AI: "${title}" - ${shareUrl}`
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out this chat on Nexora AI: "${title}"`
  )}&url=${encodeURIComponent(shareUrl)}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔗</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text)" }}>Share link to Chat</h3>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Anyone with this link will be able to view this conversation.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Preview snippet */}
        <div className="share-preview-box">
          <div className="share-preview-title">{title}</div>
          <div className="share-preview-meta">
            <span>💬 {messages?.length || 0} messages</span>
            <span>•</span>
            <span>Mode: {conversation?.mode || "General"}</span>
          </div>
        </div>

        {/* Link box */}
        <div className="share-link-row">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="share-link-input"
            onClick={(e) => e.target.select()}
          />
          <button
            className={`btn-primary share-copy-btn${copied ? " ok" : ""}`}
            onClick={handleCopyLink}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Social and quick share options */}
        <div className="share-social-row">
          <button
            className="share-social-btn"
            onClick={handleCopyFullText}
            title="Copy entire conversation text"
          >
            📋 {copiedText ? "✓ Text Copied!" : "Copy Chat Text"}
          </button>

          {typeof navigator !== "undefined" && navigator.share && (
            <button className="share-social-btn" onClick={handleNativeShare} title="Native Device Share">
              📱 Share App
            </button>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-social-btn whatsapp"
            title="Share on WhatsApp"
          >
            💬 WhatsApp
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-social-btn twitter"
            title="Share on X (Twitter)"
          >
            𝕏 Post
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-social-btn linkedin"
            title="Share on LinkedIn"
          >
            in LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
