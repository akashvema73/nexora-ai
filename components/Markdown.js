"use client";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Pre({ children }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="codewrap">
      <button type="button" className="copybtn" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export default function Markdown({ text }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: Pre }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
