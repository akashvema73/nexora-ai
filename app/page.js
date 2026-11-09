"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MODES } from "@/lib/prompts";
import Sidebar from "@/components/Sidebar";
import ModeSelector from "@/components/ModeSelector";
import MessageBubble from "@/components/MessageBubble";
import Composer from "@/components/Composer";
import { speakText, stopSpeech } from "@/lib/voice";

export default function Home() {
  const router = useRouter();

  // Auth
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  // Conversations
  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  // UI state
  const [mode, setMode] = useState("coding");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Scroll
  const bottomRef = useRef(null);
  const feedRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // ── Auth ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else { setSession(data.session); setReady(true); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // ── Conversations ─────────────────────────────────────
  const loadConvs = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id,title,mode,updated_at")
      .order("updated_at", { ascending: false });
    setConvs(data || []);
  }, []);

  useEffect(() => { if (ready) loadConvs(); }, [ready, loadConvs]);

  // ── Smart Scroll ──────────────────────────────────────
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const handler = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setUserScrolled(!nearBottom);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!userScrolled) {
      if (loading) {
        if (feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages, userScrolled, loading]);

  // ── Open conversation ────────────────────────────────
  async function openConv(c) {
    if (loading) return;
    stopSpeech();
    setActiveId(c.id);
    setMode(c.mode in MODES ? c.mode : "coding");
    setSidebarOpen(false);
    setUserScrolled(false);
    const { data } = await supabase
      .from("messages")
      .select("id,role,content")
      .eq("conversation_id", c.id)
      .order("created_at");
    setMessages(data || []);
  }

  function newChat() {
    if (loading) return;
    stopSpeech();
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
    setWebSearch(false);
    setSelectedFile(null);
    setUserScrolled(false);
  }

  async function deleteConv(id) {
    if (!confirm("Delete this conversation?")) return;
    await supabase.from("conversations").delete().eq("id", id);
    if (id === activeId) newChat();
    loadConvs();
  }

  // ── Send message ─────────────────────────────────────
  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setUserScrolled(false);
    setLoading(true);

    // Optimistically add messages
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    const setLast = (content) =>
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content };
        return copy;
      });

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          conversationId: activeId,
          mode,
          webSearch,
        }),
      });

      if (!res.ok) {
        let msg = "Something went wrong.";
        try { msg = (await res.json()).error || msg; } catch {}
        setLast("**Error:** " + msg);
      } else {
        const newId = res.headers.get("X-Conversation-Id");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        let rafId = null;
        let pending = false;

        const scheduleUpdate = () => {
          if (pending) return;
          pending = true;
          rafId = requestAnimationFrame(() => {
            pending = false;
            setLast(acc);
            if (!userScrolled && feedRef.current) {
              feedRef.current.scrollTop = feedRef.current.scrollHeight;
            }
          });
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          scheduleUpdate();
        }

        if (rafId) cancelAnimationFrame(rafId);
        setLast(acc);
        if (!userScrolled && feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }

        // Voice Assistant: Auto-read response if Voice Mode is active
        if (voiceMode && acc) {
          speakText(acc);
        }

        if (newId && newId !== activeId) {
          setActiveId(newId);
        }
        loadConvs();
      }
    } catch {
      setLast("**Error:** Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  }

  // ── Regenerate last response ─────────────────────────
  async function regenerate() {
    if (loading || messages.length < 2) return;
    // Find last user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Remove last assistant message and re-send
    setMessages((m) => m.slice(0, -1));
    await send(lastUser.content);
  }

  // ── Mode change ───────────────────────────────────────
  function handleModeChange(newMode) {
    if (messages.length > 0) {
      if (!confirm("Changing mode will start a new conversation. Continue?")) return;
      newChat();
    }
    setMode(newMode);
  }

  // ── Loading screen ────────────────────────────────────
  if (!ready) {
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <span>Loading Nexora AI…</span>
      </div>
    );
  }

  const userEmail = session?.user?.email || "";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";
  const currentMode = MODES[mode];

  return (
    <div className="app">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        convs={convs}
        activeId={activeId}
        onNewChat={newChat}
        onOpenConv={openConv}
        onDeleteConv={deleteConv}
        session={session}
        onSignOut={() => supabase.auth.signOut()}
        loading={loading}
      />

      {/* Main */}
      <div className="main">
        {/* Header */}
        <header className="header">
          <button
            className="header-burger"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <ModeSelector
            mode={mode}
            onChange={handleModeChange}
            disabled={loading}
          />

          <div className="header-spacer" />

          {/* Voice Assistant Auto-Speak Toggle */}
          <button
            className={`voice-toggle-btn${voiceMode ? " on" : ""}`}
            onClick={() => {
              if (voiceMode) stopSpeech();
              setVoiceMode((v) => !v);
            }}
            title={voiceMode ? "Auto Voice Readout: ON (Click to mute)" : "Auto Voice Readout: OFF (Click to turn on)"}
            type="button"
          >
            {voiceMode ? "🔊 Voice: ON" : "🔇 Voice: OFF"}
          </button>
        </header>

        {/* Chat feed */}
        <section
          className="feed"
          ref={feedRef}
          aria-label="Conversation"
        >
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="welcome">
              <img
                className="welcome-logo"
                src="/nexora-logo.png"
                alt="Nexora AI"
                onError={(e) => { e.target.src = "/logo.jpg"; }}
              />
              <h1>What can I help you with?</h1>
              <p className="welcome-sub">
                Choose a suggestion below or type anything to get started
              </p>
              <div className="suggestions-grid">
                {currentMode.suggestions.map((s) => (
                  <button
                    key={s.text}
                    className="suggestion-card"
                    onClick={() => send(s.text)}
                    disabled={loading}
                  >
                    <span className="suggestion-card-icon">{s.icon}</span>
                    <span className="suggestion-card-text">{s.text}</span>
                    <span className="suggestion-card-hint">{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message thread */
            <div className="feed-inner">
              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <MessageBubble
                    key={msg.id || i}
                    msg={msg}
                    userInitials={userInitials}
                    onRegenerate={isLast && msg.role === "assistant" ? regenerate : null}
                    isLast={isLast}
                    isLoading={loading}
                  />
                );
              })}
              <div ref={bottomRef} style={{ height: 1 }} />
            </div>
          )}
        </section>

        {/* Scroll to bottom fab (shows when user has scrolled up) */}
        {userScrolled && messages.length > 0 && (
          <button
            onClick={() => {
              setUserScrolled(false);
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              position: "fixed",
              bottom: 110,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--panel2)",
              border: "1px solid var(--line2)",
              borderRadius: "var(--radius-pill)",
              padding: "7px 16px",
              fontSize: 13,
              color: "var(--text2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "var(--shadow)",
              zIndex: 10,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* Composer */}
        <Composer
          input={input}
          setInput={setInput}
          onSend={send}
          loading={loading}
          mode={mode}
          webSearch={webSearch}
          setWebSearch={setWebSearch}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </div>
    </div>
  );
}
