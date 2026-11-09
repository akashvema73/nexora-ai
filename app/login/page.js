"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const FEATURES = [
  { icon: "💻", bg: "rgba(6,182,212,0.15)", text: "Expert coding help — debug, build, explain" },
  { icon: "📚", bg: "rgba(167,139,250,0.15)", text: "Smart study tutor with quizzes & notes" },
  { icon: "🎨", bg: "rgba(244,114,182,0.15)", text: "Creative writing & brainstorming partner" },
  { icon: "🌐", bg: "rgba(52,211,153,0.15)", text: "Live web search for up-to-date answers" },
];

export default function Login() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim()) {
      return setError("Please enter your email address.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) throw signUpErr;

        if (data?.session) {
          router.replace("/");
        } else {
          setNotice("Account ban gaya! Email check karein ya abhi login karein.");
          setIsSignup(false);
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-brand">
          <img
            src="/nexora-logo.png"
            alt="Nexora AI"
            className="auth-hero-brand"
            style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}
            onError={(e) => { e.target.src = "/logo.jpg"; }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>
            Nexora AI
          </span>
        </div>

        <div className="auth-hero-heading">
          <h1>
            Your{" "}
            <span className="grad-text">intelligent</span>
            {" "}AI assistant for everything
          </h1>
          <p>
            From debugging code to acing exams, crafting stories to real-time web research — Nexora AI has you covered.
          </p>
        </div>

        <div className="auth-features">
          {FEATURES.map((f, i) => (
            <div className="auth-feature" key={i}>
              <div className="auth-feature-icon" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{isSignup ? "Create account" : "Welcome back"}</h2>
            <p>
              {isSignup
                ? "Sign up to start using Nexora AI — no card needed."
                : "Sign in to continue to Nexora AI."}
            </p>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>

            {error  && <div className="auth-alert err" role="alert">⚠ {error}</div>}
            {notice && <div className="auth-alert ok"  role="status">✓ {notice}</div>}

            <button className="btn-primary" disabled={busy} type="submit">
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            className="btn-link"
            type="button"
            onClick={() => {
              setIsSignup((v) => !v);
              setError("");
              setNotice("");
            }}
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up free"}
          </button>
        </div>
      </div>
    </main>
  );
}
