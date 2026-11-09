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
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      // Redirect handled by Supabase OAuth flow
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setError("Google Login abhi Supabase me enable nahi hai. Supabase Dashboard -> Authentication -> Providers me Google enable karein, ya neeche diye gaye Email option se login karein.");
      } else {
        setError(msg || "Google sign-in failed. Please try again.");
      }
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/");
        } else {
          setNotice("Account created! Check your email to confirm, then log in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
            <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{isSignup ? "Start for free — no credit card required." : "Sign in to continue to Nexora AI."}</p>
          </div>

          {/* Google OAuth */}
          <button
            className="btn-oauth"
            onClick={handleGoogleSignIn}
            disabled={googleBusy || busy}
            type="button"
          >
            {googleBusy ? (
              <span>Signing in with Google…</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider">or continue with email</div>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

            <button className="btn-primary" disabled={busy || googleBusy} type="submit">
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            className="btn-link"
            type="button"
            onClick={() => { setIsSignup((v) => !v); setError(""); setNotice(""); }}
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
