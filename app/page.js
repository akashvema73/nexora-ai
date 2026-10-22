"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MODES } from "@/lib/prompts";
import Markdown from "@/components/Markdown";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("coding");
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);

const [toolsOpen, setToolsOpen] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
const fileInputRef = useRef(null);



  
  const bottomRef = useRef(null);
  const taRef = useRef(null);

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

  const loadConvs = useCallback(async () => {
    const { data } = await supabase.from("conversations").select("id,title,mode,updated_at").order("updated_at", { ascending: false });
    setConvs(data || []);
  }, []);

  useEffect(() => { if (ready) loadConvs(); }, [ready, loadConvs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function openConv(c) {
    if (loading) return;
    setActiveId(c.id);
    setMode(c.mode in MODES ? c.mode : "coding");
    setMenu(false);
    const { data } = await supabase.from("messages").select("id,role,content").eq("conversation_id", c.id).order("created_at");
    setMessages(data || []);
  }

  function newChat() {
    if (loading) return;
    setActiveId(null);
    setMessages([]);
    setMenu(false);
  }

  async function removeConv(e, id) {
    e.stopPropagation();
    if (!confirm("Ye chat delete karni hai?")) return;
    await supabase.from("conversations").delete().eq("id", id);
    if (id === activeId) newChat();
    loadConvs();
  }

  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    const setLast = (content) =>
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content }; return c; });

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, conversationId: activeId, mode }),
      });
      if (!res.ok) {
        let msg = "Kuch galat hua.";
        try { msg = (await res.json()).error || msg; } catch {}
        setLast("**Error:** " + msg);
      } else {
        const newId = res.headers.get("X-Conversation-Id");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setLast(acc);
        }
        if (newId && newId !== activeId) setActiveId(newId);
        loadConvs();
      }
    } catch {
      setLast("**Error:** Network problem hai. Internet check karke dobara try karo.");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function onInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  if (!ready) return <div className="boot">Nexora AI load ho raha hai...</div>;
  const m = MODES[mode];

  return (
    <div className="app">
      <aside className={"side" + (menu ? " open" : "")}>
        <div className="logo"><img className="logomark" src="/logo.jpg" alt="" />Nexora AI</div>
        <button className="primary" onClick={newChat}>+ New chat</button>
        <div className="convs">
          {convs.length === 0 && <p className="muted small">Abhi koi chat nahi hai.</p>}
          {convs.map((c) => (
            <div key={c.id} className={"conv" + (c.id === activeId ? " active" : "")} onClick={() => openConv(c)}>
              <span className={"dot " + c.mode} />
              <span className="ctitle">{c.title}</span>
              <button className="del" aria-label="Delete chat" onClick={(e) => removeConv(e, c.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="user">
          <span className="email">{session?.user?.email}</span>
          <button className="link" onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}

      <main className="main">
        <header className="top">
          <button className="burger" aria-label="Menu" onClick={() => setMenu(true)}>☰</button>
          <div className="tabs" role="tablist">
            {Object.entries(MODES).map(([k, v]) => (
              <button key={k} role="tab" aria-selected={mode === k} className={"tab " + k + (mode === k ? " on" : "")}
                disabled={loading || (messages.length > 0 && mode !== k)} onClick={() => setMode(k)}>
                {v.label}
              </button>
            ))}
          </div>
        </header>

        <section className="feed">
          {messages.length === 0 ? (
            <div className="empty">
              <h2>{m.hint}</h2>
              <p className="muted">Kuch bhi poocho ya neeche se shuru karo.</p>
              <div className="chips">
                {m.suggestions.map((s) => (<button key={s} className="chip" onClick={() => send(s)}>{s}</button>))}
              </div>
            </div>
          ) : (
            <div className="thread">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={"row " + msg.role}>
                  <div className="bubble">
                    {msg.role === "assistant"
                      ? (msg.content ? <Markdown text={msg.content} /> : <span className="typing"><i /><i /><i /></span>)
                      : <p className="plain">{msg.content}</p>}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="composer">
          <div className="box">




<button
  type="button"
  className="plus-btn"
  aria-label="Open tools menu"
  aria-expanded={toolsOpen}
  onClick={() => setToolsOpen((open) => !open)}
>
  +
</button>

{toolsOpen && (
  <div className="tools-menu">
    <button
      type="button"
      onClick={() => {
        setToolsOpen(false);
        fileInputRef.current?.click();
      }}
    >
      📎 Upload photos & files
    </button>

    <button
      type="button"
      onClick={() => {
        setToolsOpen(false);
        alert("Web Search ko agle step mein API se connect karenge.");
      }}
    >
      🌐 Web Search
    </button>

    <button
      type="button"
      onClick={() => {
        setToolsOpen(false);
        alert("Image Generation ko agle step mein connect karenge.");
      }}
    >
      🎨 Create Image
    </button>

    <button
      type="button"
      onClick={() => {
        setToolsOpen(false);
        alert("Voice feature agle step mein add karenge.");
      }}
    >
      🎙️ Voice
    </button>

    <button
      type="button"
      onClick={() => {
        setToolsOpen(false);
        alert("Advanced Thinking ko baad mein integrate karenge.");
      }}
    >
      🧠 Thinking
    </button>
  </div>
)}

<input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf,.txt,.doc,.docx"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  }}
/>











            
            <textarea ref={taRef} rows={1} value={input} onChange={onInput} onKeyDown={onKey}
              placeholder={mode === "study" ? "Koi topic ya sawaal likho..." : mode === "coding" ? "Code ya error yahan paste karo..." : "Apna sawaal likho..."} />
            <button className="send" onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send">Send</button>
          </div>
          <p className="muted small">Enter se send, Shift+Enter se nayi line. AI galti kar sakta hai, zaroori cheezein check karo.</p>
        </footer>
      </main>
    </div>
  );
}
