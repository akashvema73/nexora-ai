"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { isSpeechRecognitionSupported, createSpeechRecognizer } from "@/lib/voice";

const TOOLS = [
  {
    id: "voice",
    icon: "🎙️",
    label: "Voice Assistant",
    desc: "Speak your prompt naturally",
  },
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
  const [isListening, setIsListening] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const toolsRef = useRef(null);
  const recognizerRef = useRef(null);

  // Auto-resize textarea
  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (isListening) stopListening();
    onSend();
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
    setToolsOpen(false);
  }

  // Speech Recognition (Speech-to-Text)
  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert("Aapke browser me Voice Input support nahi hai. Kripya Google Chrome ya Microsoft Edge browser use karein.");
      return;
    }

    stopListening();

    try {
      const recognizer = createSpeechRecognizer({
        lang: "hi-IN", // Supports Hindi and English natural speech
        onStart: () => {
          setIsListening(true);
        },
        onResult: ({ combined }) => {
          if (combined) {
            setInput(combined);
            if (taRef.current) {
              taRef.current.style.height = "auto";
              taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
            }
          }
        },
        onError: (err) => {
          console.warn("Speech error:", err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch (e) {
      alert("Microphone start nahi ho paya: " + (e?.message || "Permission issue"));
      setIsListening(false);
    }
  }, [stopListening, setInput]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Close tools popup on outside click
  useEffect(() => {
    if (!toolsOpen) return;
    const handler = (e) => {
      if (!toolsRef.current?.contains(e.target)) setToolsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolsOpen]);

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const getPlaceholder = () => {
    if (isListening) return "🎙️ Listening... Aap jo bol rahe hain wo screen par likha ja raha hai...";
    if (mode === "coding") return "Paste your code or describe a programming task…";
    if (mode === "study")  return "Ask me to explain a concept, quiz you, or make notes…";
    if (mode === "creative") return "Tell me what you want to write, brainstorm, or create…";
    return "Ask anything or click the microphone to speak…";
  };

  const canSend = !loading && input.trim().length > 0;

  return (
    <footer className="composer-wrap">
      <div className="composer-inner">
        {/* Chips row */}
        {(selectedFile || webSearch || isListening) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            {isListening && (
              <div className="voice-pill">
                <span className="voice-pill-dot" />
                <span>Listening... Bolte rahiye...</span>
                <button
                  className="file-chip-remove"
                  onClick={stopListening}
                  aria-label="Stop listening"
                  type="button"
                >
                  ×
                </button>
              </div>
            )}
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
                  type="button"
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
                  type="button"
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
                      if (tool.id === "voice") {
                        toggleListening();
                        setToolsOpen(false);
                      } else if (tool.id === "file") {
                        fileRef.current?.click();
                      } else if (tool.id === "websearch") {
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
                    {tool.id === "voice" && isListening && (
                      <span className="tool-item-badge on">Rec</span>
                    )}
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

          {/* Voice Input (Microphone) button */}
          <button
            className={`composer-mic-btn${isListening ? " listening" : ""}`}
            onClick={toggleListening}
            disabled={loading}
            title={isListening ? "Stop listening" : "Click to speak (Voice assistant)"}
            type="button"
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? "⏹" : "🎙️"}
          </button>

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
          Click <kbd style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 5px", fontSize: 11 }}>🎙️</kbd> to speak,{" "}
          <kbd style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 5px", fontSize: 11 }}>Enter</kbd> to send,{" "}
          <kbd style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 4, padding: "0 5px", fontSize: 11 }}>Shift+Enter</kbd> for new line.
        </p>
      </div>
    </footer>
  );
}
