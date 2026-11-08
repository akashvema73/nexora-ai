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

async function* streamReply(provider, system, history, webSearch = false) {
  if (provider === "gemini") {
    const defaultModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const models = [
      defaultModel,
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const bodyObj = {
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      },
    };

    if (webSearch) {
      bodyObj.tools = [{ google_search: {} }];
    }

    const payload = JSON.stringify(bodyObj);
    let res = null;
    let lastErr = "";

    outer: for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY,
              },
              body: payload,
            }
          );
          if (r.ok) {
            res = r;
            break outer;
          }
          let d = "";
          try {
            d = (await r.json()).error?.message || "";
          } catch {}
          lastErr = `Gemini (${model}) ${r.status}: ${d}`;
          if (r.status === 404) break; // Model not available, try next fallback immediately
          if (![429, 500, 503].includes(r.status)) throw new Error(lastErr);
          await new Promise((ok) => setTimeout(ok, 300 * (attempt + 1)));
        } catch (err) {
          lastErr = err.message || "Network error";
          if (attempt === 1) break;
          await new Promise((ok) => setTimeout(ok, 300));
        }
      }
    }

    if (!res) throw new Error(lastErr || "Gemini service temporarily unavailable.");

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const sourcesMap = new Map();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payloadData = line.slice(5).trim();
        if (!payloadData) continue;
        try {
          const j = JSON.parse(payloadData);
          const candidate = j.candidates?.[0];
          for (const part of candidate?.content?.parts || []) {
            if (part.text && !part.thought) {
              yield part.text;
            }
          }
          // Collect web search grounding chunks if present
          const chunks = candidate?.groundingMetadata?.groundingChunks || [];
          for (const c of chunks) {
            if (c.web?.uri) {
              sourcesMap.set(c.web.uri, {
                title: c.web.title || c.web.uri,
                url: c.web.uri,
              });
            }
          }
        } catch {}
      }
    }

    // Append web sources cleanly at the end if citations were discovered
    if (sourcesMap.size > 0) {
      const sources = Array.from(sourcesMap.values());
      yield (
        "\n\n**Sources:**\n" +
        sources.map((s) => `- [${s.title}](${s.url})`).join("\n")
      );
    }
    return;
  }

  // Anthropic Claude Provider
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    system,
    messages: history,
  });
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
      yield ev.delta.text;
    }
  }
}

export async function POST(req) {
  try {
    const configuredProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Login zaroori hai." }, 401);

    const sb = supabaseForToken(token);
    const { data: auth, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !auth?.user) return json({ error: "Session expire ho gaya. Dobara login karo." }, 401);
    const user = auth.user;

    const body = await req.json();
    const webSearch = body.webSearch === true;
    const provider = webSearch ? "gemini" : configuredProvider;

    const keyName = provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY";
    const keyVal = process.env[keyName] || "";
    if (!keyVal || keyVal.startsWith("your-")) {
      return json({ error: `Server par ${keyName} set nahi hai. .env.local check karo.` }, 500);
    }

    const text = String(body.message || "").trim();
    const mode = MODES[body.mode] ? body.mode : "coding";
    let conversationId = body.conversationId || null;
    if (!text) return json({ error: "Message khaali hai." }, 400);
    if (text.length > 8000) return json({ error: "Message bahut lamba hai (max 8000 characters)." }, 400);

    // Concurrently execute:
    // 1. Daily message limit count query
    // 2. Conversation creation (if new) OR history fetch (if existing)
    const limit = parseInt(process.env.DAILY_MESSAGE_LIMIT || "50", 10);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const limitPromise = sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", start.toISOString());

    const secondPromise = conversationId
      ? sb
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(20)
      : sb
          .from("conversations")
          .insert({
            title: text.replace(/\s+/g, " ").slice(0, 60),
            mode,
            user_id: user.id,
          })
          .select("id")
          .single();

    const [limitRes, secondRes] = await Promise.all([limitPromise, secondPromise]);

    if ((limitRes.count || 0) >= limit) {
      return json({ error: `Aaj ki limit (${limit} messages) poori ho gayi. Kal dobara try karo.` }, 429);
    }

    let history = [];
    if (conversationId) {
      if (secondRes.error) {
        return json({ error: "Chat load nahi ho payi: " + secondRes.error.message }, 500);
      }
      history = (secondRes.data || []).reverse().map((m) => ({ role: m.role, content: m.content }));
    } else {
      if (secondRes.error || !secondRes.data) {
        return json({ error: "Chat save nahi ho payi: " + (secondRes.error?.message || "DB error") }, 500);
      }
      conversationId = secondRes.data.id;
    }

    // Non-blocking user message insert (runs concurrently without delaying LLM stream start)
    const saveUserMsgPromise = sb.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: text,
    });

    // Append current prompt directly to history in memory
    history.push({ role: "user", content: text });

    const system = MODES[mode].system + BASE_RULES;
    const encoder = new TextEncoder();
    let full = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamReply(provider, system, history, webSearch)) {
            full += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          if (full) {
            // Await user message insert before inserting assistant message to guarantee timeline order
            await saveUserMsgPromise.catch(() => {});
            await Promise.all([
              sb.from("messages").insert({
                conversation_id: conversationId,
                user_id: user.id,
                role: "assistant",
                content: full,
              }),
              sb.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId),
            ]);
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
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (e) {
    return json({ error: "Server error: " + (e?.message || "unknown") }, 500);
  }
}
