"use client";
import { useState, useRef, useEffect } from "react";
import { MODES } from "@/lib/prompts";

const MODE_COLORS = {
  coding: "var(--mode-coding)",
  study: "var(--mode-study)",
  general: "var(--mode-general)",
  creative: "var(--mode-creative)",
};

export default function ModeSelector({ mode, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = MODES[mode];

  return (
    <div className="mode-selector" ref={ref}>
      <button
        className={`mode-selector-btn${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ fontSize: 16 }}>{current?.icon}</span>
        <span>{current?.label}</span>
        <span className="chevron">▾</span>
      </button>

      {open && (
        <div className="mode-dropdown" role="listbox">
          {Object.entries(MODES).map(([key, m]) => (
            <div
              key={key}
              className={`mode-option${mode === key ? " active" : ""}`}
              role="option"
              aria-selected={mode === key}
              onClick={() => { onChange(key); setOpen(false); }}
            >
              <span
                className="mode-dot-lg"
                style={{ background: MODE_COLORS[key] }}
              />
              <div className="mode-option-info">
                <div className="mode-option-name">
                  {m.icon} {m.label}
                </div>
                <div className="mode-option-desc">{m.description}</div>
              </div>
              <span className="check">✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
