"use client";
import { useState, useCallback, memo } from "react";

function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

function MarkdownContent({ text }) {
  const [copiedBlock, setCopiedBlock] = useState(null);

  const handleCopy = useCallback(async (code, id) => {
    try {
      await copyToClipboard(code);
      setCopiedBlock(id);
      setTimeout(() => setCopiedBlock(null), 2000);
    } catch {}
  }, []);

  // Parse and render markdown to React elements
  const renderMarkdown = (input) => {
    const lines = input.split("\n");
    const elements = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block
      if (line.startsWith("```")) {
        const lang = line.slice(3).trim() || "text";
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        const code = codeLines.join("\n");
        const blockId = `block-${key}`;
        elements.push(
          <div key={key++} className="code-block">
            <div className="code-header">
              <span className="code-lang">{lang}</span>
              <button
                className={`code-copy-btn${copiedBlock === blockId ? " copied" : ""}`}
                onClick={() => handleCopy(code, blockId)}
              >
                {copiedBlock === blockId ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Heading
      const h3 = line.match(/^### (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h1 = line.match(/^# (.+)/);
      if (h1) { elements.push(<h1 key={key++}>{renderInline(h1[1])}</h1>); i++; continue; }
      if (h2) { elements.push(<h2 key={key++}>{renderInline(h2[1])}</h2>); i++; continue; }
      if (h3) { elements.push(<h3 key={key++}>{renderInline(h3[1])}</h3>); i++; continue; }

      // Blockquote
      if (line.startsWith("> ")) {
        const quoteLines = [];
        while (i < lines.length && lines[i].startsWith("> ")) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <blockquote key={key++}>
            {quoteLines.map((l, idx) => <p key={idx}>{renderInline(l)}</p>)}
          </blockquote>
        );
        continue;
      }

      // Unordered list
      if (line.match(/^[-*+] /)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^[-*+] /)) {
          items.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <ul key={key++}>
            {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\. /)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^\d+\. /)) {
          items.push(lines[i].replace(/^\d+\. /, ""));
          i++;
        }
        elements.push(
          <ol key={key++}>
            {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
          </ol>
        );
        continue;
      }

      // Table (basic)
      if (line.includes("|") && lines[i + 1]?.match(/^\|?[-| :]+\|?$/)) {
        const tableLines = [];
        while (i < lines.length && lines[i].includes("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        const rows = tableLines
          .filter((l) => !l.match(/^\|?[-| :]+\|?$/))
          .map((l) => l.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr[0] !== "" && idx === 0)));
        if (rows.length > 0) {
          elements.push(
            <table key={key++}>
              <thead>
                <tr>{rows[0].map((cell, ci) => <th key={ci}>{renderInline(cell.trim())}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell.trim())}</td>)}</tr>
                ))}
              </tbody>
            </table>
          );
        }
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        elements.push(<hr key={key++} />);
        i++;
        continue;
      }

      // Empty line (paragraph break)
      if (line.trim() === "") { i++; continue; }

      // Paragraph
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") &&
             !lines[i].startsWith("#") && !lines[i].startsWith("> ") &&
             !lines[i].match(/^[-*+] /) && !lines[i].match(/^\d+\. /)) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) {
        elements.push(<p key={key++}>{renderInline(paraLines.join("\n"))}</p>);
      }
    }

    return elements;
  };

  const renderInline = (text) => {
    // Split on bold, italic, inline code, links
    const parts = [];
    let remaining = text;
    let key = 0;

    const patterns = [
      { re: /\*\*(.+?)\*\*/,     render: (m) => <strong key={key++}>{m[1]}</strong> },
      { re: /\*(.+?)\*/,          render: (m) => <em key={key++}>{m[1]}</em> },
      { re: /`(.+?)`/,            render: (m) => <code key={key++}>{m[1]}</code> },
      { re: /\[(.+?)\]\((.+?)\)/, render: (m) => <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a> },
    ];

    while (remaining.length > 0) {
      let earliest = null;
      let earliestMatch = null;
      let earliestPattern = null;

      for (const p of patterns) {
        const m = remaining.match(p.re);
        if (m && (earliest === null || m.index < earliest)) {
          earliest = m.index;
          earliestMatch = m;
          earliestPattern = p;
        }
      }

      if (earliest === null) {
        parts.push(remaining);
        break;
      }

      if (earliest > 0) parts.push(remaining.slice(0, earliest));
      parts.push(earliestPattern.render(earliestMatch));
      remaining = remaining.slice(earliest + earliestMatch[0].length);
    }

    return parts;
  };

  return <div className="md">{renderMarkdown(text)}</div>;
}

export default memo(function Markdown({ text }) {
  if (!text) return null;
  return <MarkdownContent text={text} />;
});
