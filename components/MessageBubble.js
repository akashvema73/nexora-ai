"use client";
import React, { useState, useCallback, useEffect, memo } from "react";
import Markdown from "@/components/Markdown";
import { speakText, stopSpeech } from "@/lib/voice";

function copyText(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function MessageBubble({ msg, userInitials, onRegenerate, isLast, isLoading }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [liked, setLiked] = useState(null); // null | 'up' | 'down'
  const [speaking, setSpeaking] = useState(false);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (speaking) stopSpeech();
    };
  }, [speaking]);

  const handleCopy = useCallback(async () => {
    try {
      await copyText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [msg.content]);

  const handleShareMessage = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Nexora AI Answer",
          text: msg.content,
        });
      } else {
        await copyText(msg.content);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  }, [msg.content]);

  const handleToggleSpeak = useCallback(() => {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
    } else {
      speakText(msg.content, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }, [speaking, msg.content]);

  const isUser = msg.role === "user";
  const isEmpty = !msg.content;

  return (
    <div className={`msg-row ${isUser ? "user" : "ai"}`}>
      {/* Avatar */}
      <div className={`msg-avatar ${isUser ? "user-av" : "ai"}`}>
        {isUser ? (userInitials || "U") : "N"}
      </div>

      {/* Content */}
      <div className="msg-content">
        {isUser ? (
          <div className="bubble-user">{msg.content}</div>
        ) : (
          <div className="bubble-ai">
            {isEmpty ? (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            ) : (
              <Markdown text={msg.content} />
            )}

            {/* Action bar — only for AI messages with content */}
            {!isEmpty && (
              <div className="msg-actions">
                <button
                  className={`msg-action-btn${speaking ? " active-voice" : ""}`}
                  onClick={handleToggleSpeak}
                  title={speaking ? "Stop reading" : "Read aloud (Listen)"}
                >
                  {speaking ? "⏹ Stop" : "🔊 Listen"}
                </button>
                <button
                  className={`msg-action-btn${liked === "up" ? " liked" : ""}`}
                  onClick={() => setLiked((v) => (v === "up" ? null : "up"))}
                  title="Good response"
                >
                  👍
                </button>
                <button
                  className={`msg-action-btn${liked === "down" ? " disliked" : ""}`}
                  onClick={() => setLiked((v) => (v === "down" ? null : "down"))}
                  title="Bad response"
                >
                  👎
                </button>
                <button
                  className="msg-action-btn"
                  onClick={handleCopy}
                  title="Copy message"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button
                  className="msg-action-btn"
                  onClick={handleShareMessage}
                  title="Share response"
                >
                  {shared ? "✓ Shared!" : "🔗 Share"}
                </button>
                {isLast && onRegenerate && !isLoading && (
                  <button
                    className="msg-action-btn"
                    onClick={onRegenerate}
                    title="Regenerate response"
                  >
                    🔄 Regenerate
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble, (prev, next) => {
  return (
    prev.msg.content === next.msg.content &&
    prev.msg.role === next.msg.role &&
    prev.isLast === next.isLast &&
    prev.isLoading === next.isLoading &&
    prev.userInitials === next.userInitials
  );
});
