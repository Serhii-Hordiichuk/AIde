import { useState, type ReactNode } from "react";

/* Compact markdown renderer: headings, lists, quotes, bold/italic,
   inline code, links and code blocks with a copy button. */

function inline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("`")) {
      parts.push(<code key={k}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("**")) {
      parts.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (mm) parts.push(<a key={k} href={mm[2]} target="_blank" rel="noreferrer">{mm[1]}</a>);
    } else {
      parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <pre>
      <span
        className="flex items-center justify-between border-b border-line bg-ink-900 px-3.5 py-1.5"
        style={{ borderBottomWidth: 1 }}
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{lang || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="font-mono text-[11px] text-dim transition-colors hover:text-ember"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </span>
      <code>{code.replace(/\n$/, "")}</code>
    </pre>
  );
}

function textBlock(block: string, keyBase: string): ReactNode {
  const lines = block.split("\n");
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let ordered: string[] = [];
  let li = 0;

  const flushPara = () => {
    if (para.length) {
      out.push(<p key={`${keyBase}-p${li++}`}>{inline(para.join(" "), `${keyBase}-p${li}`)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push(<ul key={`${keyBase}-ul${li++}`}>{list.map((l, j) => <li key={j}>{inline(l, `${keyBase}-li${li}-${j}`)}</li>)}</ul>);
      list = [];
    }
    if (ordered.length) {
      out.push(<ol key={`${keyBase}-ol${li++}`}>{ordered.map((l, j) => <li key={j}>{inline(l, `${keyBase}-oi${li}-${j}`)}</li>)}</ol>);
      ordered = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (/^#{1,3}\s/.test(t)) {
      flushPara(); flushList();
      const lvl = (t.match(/^#+/) || ["#"])[0].length;
      const txt = t.replace(/^#+\s*/, "");
      const H = lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      out.push(<H key={`${keyBase}-h${li++}`}>{inline(txt, `${keyBase}-h${li}`)}</H>);
    } else if (/^[-*]\s+/.test(t)) {
      flushPara();
      list.push(t.replace(/^[-*]\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(t)) {
      flushPara();
      ordered.push(t.replace(/^\d+[.)]\s+/, ""));
    } else if (/^>\s?/.test(t)) {
      flushPara(); flushList();
      out.push(<blockquote key={`${keyBase}-q${li++}`}>{inline(t.replace(/^>\s?/, ""), `${keyBase}-q${li}`)}</blockquote>);
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      flushPara(); flushList();
      out.push(<hr key={`${keyBase}-hr${li++}`} />);
    } else if (t === "") {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(t);
    }
  }
  flushPara(); flushList();
  return <>{out}</>;
}

export function Markdown({ src }: { src: string }) {
  const nodes: ReactNode[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) nodes.push(<span key={`t${i}`}>{textBlock(src.slice(last, m.index), `t${i}`)}</span>);
    nodes.push(<CodeBlock key={`c${i}`} lang={m[1]} code={m[2]} />);
    last = m.index + m[0].length;
    i++;
  }
  if (last < src.length) nodes.push(<span key={`t${i}`}>{textBlock(src.slice(last), `t${i}`)}</span>);
  return <div className="md">{nodes}</div>;
}
