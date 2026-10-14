import Anthropic from "@anthropic-ai/sdk";
import { supabaseForToken } from "@/lib/supabaseServer";
import { MODES, BASE_RULES } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function* streamReply(provider, system, history) {
  if (provider === "gemini") {
    const models = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"].filter(
      (m, i, arr) => arr.indexOf(m) === i
    );
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 4000 },
    });
    let res = null;
    let lastErr = "";
    // Busy (503/429/500) ho toh dobara try karo, phir doosre model par jao
    outer: for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
            body: payload,
          }
        );
        if (r.ok) { res = r; break outer; }
        let d = "";
        try { d = (await r.json()).error?.message || ""; } catch {}
        lastErr = `Gemini ${r.status}: ${d}`;
        if (r.status === 404) break; // is model ka naam nahi mila, agla model try karo
        if (![429, 500, 503].includes(r.status)) throw new Error(lastErr);
        await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
      }
    }
    if (!res) throw new Error(lastErr + " (kuch der baad dobara try karo)");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const j = JSON.parse(payload);
          for (const part of j.candidates?.[0]?.content?.parts || []) {
            if (part.text && !part.thought) yield part.text;
          }
        } catch {}
      }
    }
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4000,
    system,
    messages: history,
  });
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
  }
}

export async function POST(req) {
  try {
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const keyName = provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY";
    const keyVal = process.env[keyName] || "";
    if (!keyVal || keyVal.startsWith("your-")) {
      return json({ error: `Server par ${keyName} set nahi hai. .env.local file mein apni key daalo aur server restart karo.` }, 500);
    }

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Login zaroori hai." }, 401);

    const sb = supabaseForToken(token);
    const { data: auth, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !auth?.user) return json({ error: "Session expire ho gaya. Dobara login karo." }, 401);
    const user = auth.user;

    const body = await req.json();
    const text = String(body.message || "").trim();
    const mode = MODES[body.mode] ? body.mode : "coding";
    let conversationId = body.conversationId || null;
    if (!text) return json({ error: "Message khaali hai." }, 400);
    if (text.length > 8000) return json({ error: "Message bahut lamba hai (max 8000 characters)." }, 400);

    // Daily limit
    const limit = parseInt(process.env.DAILY_MESSAGE_LIMIT || "50", 10);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { count } = await sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", start.toISOString());
    if ((count || 0) >= limit) {
      return json({ error: `Aaj ki limit (${limit} messages) poori ho gayi. Kal dobara try karo.` }, 429);
    }

    // Conversation
    if (!conversationId) {
      const title = text.replace(/\s+/g, " ").slice(0, 60);
      const { data: conv, error } = await sb
        .from("conversations")
        .insert({ title, mode, user_id: user.id })
        .select("id")
        .single();
      if (error) return json({ error: "Chat save nahi ho payi: " + error.message }, 500);
      conversationId = conv.id;
    }

    const { error: insErr } = await sb
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: text });
    if (insErr) return json({ error: "Message save nahi hua: " + insErr.message }, 500);

    const { data: rows } = await sb
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(30);
    const history = (rows || []).reverse().map((m) => ({ role: m.role, content: m.content }));

    const system = MODES[mode].system + BASE_RULES;

    const encoder = new TextEncoder();
    let full = "";
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamReply(provider, system, history)) {
            full += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          if (full) {
            await sb.from("messages").insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: "assistant",
              content: full,
            });
            await sb.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
          }
        } catch (e) {
          controller.enqueue(encoder.encode("\n\n**Error:** AI se jawab nahi aa paya. " + (e?.message || "")));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (e) {
    return json({ error: "Server error: " + (e?.message || "unknown") }, 500);
  }
}