"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 6) return setError("Password kam se kam 6 characters ka hona chahiye.");
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) router.replace("/");
        else setNotice("Account ban gaya. Apna email check karke confirm karo, phir login karo.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Kuch galat hua, dobara try karo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="authside">
        <div className="logo big"><img className="logomark" src="/logo.jpg" alt="" />Nexora AI</div>
        <h1>Code likho. Concepts samjho. Exam clear karo.</h1>
        <p>Debugging se lekar revision notes tak, ek hi jagah par.</p>
        <img className="hero" src="/logo.jpg" alt="Nexora AI logo" />
      </div>
      <form className="authcard" onSubmit={submit}>
        <h2>{isSignup ? "Account banao" : "Wapas aao"}</h2>
        <label>Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aap@example.com" autoComplete="email" />
        </label>
        <label>Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kam se kam 6 characters" autoComplete={isSignup ? "new-password" : "current-password"} />
        </label>
        {error && <div className="msg err" role="alert">{error}</div>}
        {notice && <div className="msg ok" role="status">{notice}</div>}
        <button className="primary" disabled={busy}>{busy ? "Ruko..." : isSignup ? "Sign up" : "Login"}</button>
        <button type="button" className="link" onClick={() => { setIsSignup(!isSignup); setError(""); setNotice(""); }}>
          {isSignup ? "Pehle se account hai? Login karo" : "Naya account banana hai? Sign up karo"}
        </button>
      </form>
    </main>
  );
}
