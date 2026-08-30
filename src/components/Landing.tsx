import { useEffect, useRef, useState } from "react";
import { PROVIDERS } from "../data/providers";
import { BrandMark, Wordmark, ChatIcon, CodeIcon, TranslateIcon, KeyIcon, CheckIcon, GlobeIcon, MicIcon, BoltIcon } from "./Icons";
import { ThemeToggle, LangPicker } from "./Appearance";
import { useI18n } from "../lib/i18n";
import type { ThemeMode } from "../lib/theme";

/* =================================================================
   Landing page — shown to everyone without a DID identity.
   "Get started" → registration (DID creation) → full app access.
   "Sign in"     → restore an existing identity from backup.
   ================================================================= */

interface Props {
  onStart: () => void;   // register → enter app
  onRestore: () => void; // sign in with backup
  theme: { mode: ThemeMode; setMode: (m: ThemeMode) => void };
}

const SCENES = [
  {
    prompt: "build me a pomodoro timer",
    reply:
      "⏺ Architect · 4 subtasks · 3 specialists\n" +
      "[UI]   + index.html  (86 lines)\n" +
      "[FE]   + timer.js    (41 lines)\n" +
      "[QA]   ✓ build passed · preview is live",
  },
  {
    prompt: "explain RAG in one breath",
    reply:
      "Retrieval-Augmented Generation: the model looks up\n" +
      "relevant chunks in a vector index first, then answers\n" +
      "grounded in them — memory you can point to.",
  },
  {
    prompt: "переклади: «добрий вечір, колего»",
    reply:
      "→ en · Good evening, colleague\n" +
      "🔊 spoken aloud · auto-detected uk → en",
  },
];

const MODELS_TICKER = [
  "Auto Free routing", "Auto Local", "live model catalog", "100% free models",
  ...PROVIDERS.map((p) => p.name),
  "did:key login", "zero tracking", "works offline",
];

const FAQS = [
  {
    q: "Is AiDe really free?",
    a: "Yes — there are no paid models anywhere. AiDe talks to free tiers (Gemini, Groq, Cerebras, SambaNova…), keyless endpoints like Pollinations, and your own local runtimes (Ollama, LM Studio, vLLM). The model catalog is fetched live from each provider's API, so you only ever see what's actually available right now.",
  },
  {
    q: "What is a DID and why is it my login?",
    a: "A Decentralized Identifier (did:key) is a cryptographic identity generated on your device — an ECDSA P-256 keypair. There is no email, no password, no account server. Registering takes ~3 seconds, and a backup file lets you restore the same identity anywhere.",
  },
  {
    q: "Where does my data live?",
    a: "Entirely in your browser: chats, projects, translations, provider keys and the DID itself are stored in localStorage on this device. Requests go directly from your browser to the provider you chose — nothing passes through AiDe servers, because there are none.",
  },
  {
    q: "Does the Coder really create projects?",
    a: "Yes. The Architect decomposes your brief into subtasks by specialty — UI Designer, Frontend Engineer, Technical Writer, QA — the crew writes real files, and QA assembles a working preview you can open in a new tab. With a free API available the code comes from a live model; offline, a built-in generator ships fully working apps.",
  },
  {
    q: "Can the translator hold a live conversation?",
    a: "It acts as a live interpreter between two people on one device: hold your side's button and speak — the transcript appears in real time, and when you release, the translation is spoken aloud in the other person's language. The full bilingual transcript stays in the feed.",
  },
];

export default function Landing({ onStart, onRestore, theme }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  /* scroll reveals */
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll(".reveal");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("on");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative h-dvh overflow-y-auto overflow-x-clip bg-bg text-text">
      {/* ambient */}
      <div className="ambient" aria-hidden>
        <div className="dots" />
        <div className="tint tint-mint" />
        <div className="tint tint-gold" />
        <div className="noise" />
      </div>

      {/* ---------- nav ---------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-[58px] max-w-[1120px] items-center gap-3 px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <Wordmark className="text-[17px]" />
          </a>
          <nav className="ml-8 hidden items-center gap-6 text-[13px] font-bold text-dim md:flex">
            <a href="#studio" className="transition-colors hover:text-text">Studio</a>
            <a href="#coder" className="transition-colors hover:text-text">Coder</a>
            <a href="#privacy" className="transition-colors hover:text-text">Privacy</a>
            <a href="#faq" className="transition-colors hover:text-text">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LangPicker compact />
            <ThemeToggle mode={theme.mode} setMode={theme.setMode} />
            <button
              onClick={onRestore}
              className="ml-1 rounded-xl px-3 py-2 text-[13px] font-bold text-dim transition-colors hover:text-text"
            >
              {t("auth.restore")}
            </button>
            <button onClick={onStart} className="btn-brand rounded-xl px-4 py-2 text-[13px] font-extrabold">
              {t("land.ctaStart")}
            </button>
          </div>
        </div>
      </header>

      {/* ---------- hero: the terminal IS the product ---------- */}
      <section id="top" className="relative mx-auto grid max-w-[1120px] items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-violet3">
            <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-mint" />
            ai-native studio · 100% free models
          </p>
          <h1 className="font-display text-[clamp(34px,5.4vw,62px)] font-bold leading-[1.04] tracking-tight">
            <span className="mask-line"><span style={{ animationDelay: "0.05s" }}>Every free model.</span></span>
            <span className="mask-line"><span style={{ animationDelay: "0.18s" }}>One studio.</span></span>
            <span className="mask-line">
              <span style={{ animationDelay: "0.31s" }} className="text-violet2">
                Yours.<span className="wm-cursor">_</span>
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[15.5px] leading-relaxed text-dim">
            AiDe routes your chats across <b className="text-text">15+ free providers</b>, builds working apps
            from a single sentence with a <b className="text-text">crew of specialist agents</b>, and interprets
            <b className="text-text"> live conversations</b> — with a self-sovereign DID as your only login.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onStart} className="cta-sheen btn-brand flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-extrabold">
              <BoltIcon className="h-4.5 w-4.5" />
              Create free identity
            </button>
            <button
              onClick={onRestore}
              className="flex items-center gap-2 rounded-2xl border border-line2 px-5 py-3.5 text-[14px] font-bold text-dim transition-all hover:border-violet/50 hover:text-text"
            >
              <KeyIcon className="h-4 w-4" />
              Restore identity
            </button>
          </div>
          <p className="mt-6 font-mono text-[11px] tracking-wide text-faint">
            no email · no servers · keys never leave your device · ~3 second signup
          </p>
        </div>

        {/* live terminal */}
        <div className="relative">
          <TerminalDemo />
          {/* floating proof chips */}
          <div className="floaty absolute -left-5 -top-5 hidden rounded-xl border border-line2 bg-panel px-3 py-2 shadow-xl sm:block" style={{ animationDelay: "0.4s" }}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> catalog · live from APIs
            </p>
          </div>
          <div className="floaty absolute -bottom-5 -right-4 hidden rounded-xl border border-line2 bg-panel px-3 py-2 shadow-xl sm:block" style={{ animationDelay: "1.1s" }}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gold">
              <KeyIcon className="h-3 w-3" /> did:key · signed in
            </p>
          </div>
        </div>
      </section>

      {/* ---------- ticker ---------- */}
      <section className="border-y border-line bg-panel/40 py-4">
        <div className="marquee">
          <div className="marquee-track">
            {[...MODELS_TICKER, ...MODELS_TICKER].map((t, i) => (
              <span key={i} className="flex shrink-0 items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-faint">
                <span className="text-violet3">✦</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- three modes, one bento ---------- */}
      <section id="studio" className="mx-auto max-w-[1120px] px-5 py-20">
        <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="overline mb-3">the studio</p>
            <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight tracking-tight">
              Three modes.<br />
              <span className="text-violet2">One identity.</span>
            </h2>
          </div>
          <p className="max-w-[380px] text-[14px] leading-relaxed text-dim">
            Everything unlocks the moment your DID is created — no plans, no limits, no paid tier to upsell.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Coder — the big one, with the pipeline */}
          <article id="coder" className="corners reveal group relative overflow-hidden rounded-3xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-violet/40 lg:col-span-2 lg:row-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                <CodeIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">mode 02 · coder</p>
                <h3 className="text-[20px] font-extrabold">A crew, not a chatbot</h3>
              </div>
            </div>
            <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-dim">
              Describe an app in one sentence. The <b className="text-text">Architect</b> splits the brief by
              specialty — <span className="text-cyanic">UI Designer</span>, <span className="text-brand">Frontend Engineer</span>,{" "}
              <span className="text-[#c9a0ff]">Technical Writer</span>, <span className="text-[#ff8a5c]">QA</span> — the crew
              writes real files, and a working preview opens on the spot.
            </p>

            {/* pipeline */}
            <div className="mt-8 flex flex-wrap items-center gap-y-4">
              {[
                { s: "ARCH", c: "#ffc24b", t: "decompose" },
                { s: "UI", c: "#5ac8e8", t: "markup & styles" },
                { s: "FE", c: "#31e5ae", t: "logic & state" },
                { s: "DOC", c: "#c9a0ff", t: "readme" },
                { s: "QA", c: "#ff8a5c", t: "build & test" },
              ].map((r, i, arr) => (
                <div key={r.s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-10 w-14 items-center justify-center rounded-xl border font-mono text-[10px] font-bold tracking-wider transition-transform group-hover:scale-105"
                      style={{ color: r.c, borderColor: r.c + "55", background: r.c + "10" }}
                    >
                      {r.s}
                    </span>
                    <span className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-faint">{r.t}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <svg width="38" height="10" className="mx-1 max-sm:hidden" aria-hidden>
                      <line x1="0" y1="5" x2="38" y2="5" stroke="#ffffff2e" strokeWidth="1.5" className="flow-dash" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-line bg-ink/70 p-4 font-mono text-[11.5px] leading-relaxed">
              <p className="text-faint">$ aide coder</p>
              <p className="text-text">❯ “a landing page for a coffee shop called Grain”</p>
              <p className="text-cyanic">[UI] + index.html (142 lines)</p>
              <p className="text-mint">[QA] ✓ preview is live — open in new tab ↗</p>
            </div>
          </article>

          {/* Chat */}
          <article className="corners reveal group rounded-3xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-violet/40" style={{ transitionDelay: "80ms" }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/12 text-violet2">
              <ChatIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">mode 01 · chat</p>
            <h3 className="mt-1 text-[18px] font-extrabold">Auto-routed, always free</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">
              One catalog, fetched live from every provider's API. <b className="text-gold">Auto Free</b> picks the best
              model for your keys; <b className="text-cyanic">Auto Local</b> runs on your own hardware.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["streaming", "Think", "Search", "Deep Research", "voice read-aloud"].map((t) => (
                <span key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint transition-colors group-hover:border-line2 group-hover:text-dim">
                  {t}
                </span>
              ))}
            </div>
          </article>

          {/* Translate */}
          <article className="corners reveal group rounded-3xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-violet/40" style={{ transitionDelay: "160ms" }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyanic/12 text-cyanic">
              <TranslateIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">mode 03 · translate</p>
            <h3 className="mt-1 text-[18px] font-extrabold">A live interpreter in your pocket</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">
              Hold your side's button and speak — the translation is <b className="text-text">voiced to the other person</b>{" "}
              the moment you let go. Instant text and full documents too, in 60+ languages.
            </p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10.5px] text-faint">
              <MicIcon className="h-3.5 w-3.5 text-cyanic" /> push-to-talk
              <span className="text-line2">|</span>
              <GlobeIcon className="h-3.5 w-3.5 text-gold" /> auto-detect
            </div>
          </article>
        </div>
      </section>

      {/* ---------- numbers ---------- */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-6 px-5 py-12 md:grid-cols-4">
          {[
            { n: "15+", l: "free providers wired in" },
            { n: "live", l: "model catalog — no stale lists" },
            { n: "0", l: "paid models, ads or trackers" },
            { n: "~3s", l: "from zero to full access" },
          ].map((s, i) => (
            <div key={s.l} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <p className="font-display text-[clamp(26px,3vw,38px)] font-bold text-violet2">{s.n}</p>
              <p className="mt-1 text-[12.5px] font-semibold text-dim">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- privacy / DID ---------- */}
      <section id="privacy" className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 lg:grid-cols-2">
        <div className="reveal">
          <p className="overline mb-3">privacy by architecture</p>
          <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight tracking-tight">
            No account.<br />
            <span className="text-violet2">Just a key that's yours.</span>
          </h2>
          <ul className="mt-7 space-y-4">
            {[
              ["DID registration", "An ECDSA P-256 keypair is generated on-device; your did:key is derived from it. Nothing is sent anywhere."],
              ["Everything local", "Chats, projects, translations and provider keys live in this browser's localStorage — and only there."],
              ["Direct to providers", "Requests stream straight from your browser to the API you chose. AiDe has no backend to leak from."],
              ["Portable identity", "Download a backup file and restore the same identity on any device — or wipe it all in one click."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-mint/12 text-mint">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[14.5px] font-bold">{t}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* DID card */}
        <div className="reveal" style={{ transitionDelay: "120ms" }}>
          <div className="corners relative overflow-hidden rounded-3xl border border-line2 bg-panel p-7 shadow-[0_30px_80px_-40px_rgba(97,92,237,0.5)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <div>
                  <p className="text-[13px] font-extrabold">AiDe identity</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">self-sovereign · device-bound</p>
                </div>
              </div>
              <span className="rounded-full border border-mint/40 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-mint">
                active
              </span>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-ink p-4">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">did:key</p>
              <p className="mt-1.5 break-all font-mono text-[12px] leading-relaxed text-violet3">
                did:key:zDnaerx9CtbqGq9HPXtVXb2m8JqYfZ7sLp4WvN3kR5tU8yB1c
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
              {[["curve", "P-256"], ["proof", "challenge-signed"], ["storage", "this device"]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line bg-panel2 px-3 py-2.5">
                  <p className="uppercase tracking-wider text-faint">{k}</p>
                  <p className="mt-0.5 text-text">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-center font-mono text-[10.5px] text-faint">
              lose the key, lose the identity — that's the point.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-[760px] px-5 py-20">
        <p className="overline mb-3 reveal">questions</p>
        <h2 className="reveal mb-8 font-display text-[clamp(24px,3.4vw,36px)] font-bold tracking-tight">
          Asked before signing up
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative overflow-hidden border-t border-line bg-panel/50">
        <div className="absolute inset-0 opacity-[0.35]" aria-hidden>
          <div className="tint tint-mint" style={{ top: "-160px", right: "-80px" }} />
        </div>
        <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-5 py-20 text-center">
          <BrandMark className="floaty h-12 w-12 drop-shadow-[0_0_30px_#615ced66]" />
          <h2 className="reveal mt-6 font-display text-[clamp(26px,4vw,44px)] font-bold leading-tight tracking-tight">
            Ready when <span className="text-violet2">you</span> are.
          </h2>
          <p className="reveal mt-3 max-w-[440px] text-[14.5px] text-dim">
            One DID, full access — chat with every free model, ship apps with the crew, interpret live conversations.
          </p>
          <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={onStart} className="cta-sheen btn-brand flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-extrabold">
              <BoltIcon className="h-4.5 w-4.5" />
              Create free identity
            </button>
            <button
              onClick={onRestore}
              className="flex items-center gap-2 rounded-2xl border border-line2 px-5 py-3.5 text-[14px] font-bold text-dim transition-all hover:border-violet/50 hover:text-text"
            >
              <KeyIcon className="h-4 w-4" /> Sign in
            </button>
          </div>
          <p className="reveal mt-5 font-mono text-[10.5px] text-faint">registration takes ~3 seconds · backup recommended</p>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-7">
          <span className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <Wordmark className="text-[14px]" />
          </span>
          <span className="font-mono text-[10.5px] text-faint">© 2026 AiDe · MIT · local-first</span>
          <span className="ml-auto font-mono text-[10.5px] text-faint">
            made with <span className="text-violet3">&gt;_</span> by people, not subscriptions
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ================= living terminal ================= */

function TerminalDemo() {
  const [scene, setScene] = useState(0);
  const [stage, setStage] = useState<"prompt" | "gap" | "reply" | "wait">("prompt");
  const [pLen, setPLen] = useState(0);
  const [rLen, setRLen] = useState(0);
  const tick = useRef(0);

  const sc = SCENES[scene];

  useEffect(() => {
    const id = window.setInterval(() => {
      tick.current++;
      if (stage === "prompt") {
        setPLen((v) => {
          if (v < sc.prompt.length) return v + 1;
          setStage("gap");
          return v;
        });
      } else if (stage === "gap") {
        if (tick.current % 6 === 0) {
          setStage("reply");
          setRLen(0);
        }
      } else if (stage === "reply") {
        setRLen((v) => {
          if (v < sc.reply.length) return Math.min(sc.reply.length, v + 3);
          setStage("wait");
          return v;
        });
      } else if (stage === "wait") {
        if (tick.current % 40 === 0) {
          setScene((s) => (s + 1) % SCENES.length);
          setPLen(0);
          setRLen(0);
          setStage("prompt");
        }
      }
    }, 26);
    return () => window.clearInterval(id);
  }, [stage, scene, sc]);

  const replyShown = sc.reply.slice(0, rLen);

  return (
    <div className="overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.75 }} />
        ))}
        <span className="ml-2 font-mono text-[11px] text-faint">aide — studio</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-mint">
          <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> live
        </span>
      </div>
      <div className="min-h-[280px] px-5 py-4 font-mono text-[12.5px] leading-[1.75]">
        <p className="text-faint">$ aide</p>
        <p className="mt-2 text-text">
          <span className="text-violet3">❯</span> {sc.prompt.slice(0, pLen)}
          {stage === "prompt" && <span className="caret" />}
        </p>
        {(stage === "reply" || stage === "wait") && (
          <pre className="mt-3 whitespace-pre-wrap text-dim">
            {replyShown.split("\n").map((line, i) => (
              <span
                key={i}
                className={`block ${
                  line.startsWith("✓") || line.includes("✓")
                    ? "text-mint"
                    : line.startsWith("[")
                      ? "text-cyanic"
                      : line.startsWith("→")
                        ? "text-gold"
                        : line.startsWith("⏺") || line.startsWith("🔊")
                          ? "text-violet3"
                          : ""
                }`}
              >
                {line || " "}
              </span>
            ))}
            {stage === "reply" && <span className="caret" />}
          </pre>
        )}
        {stage === "gap" && (
          <span className="mt-3 flex items-center gap-1.5 text-violet3">
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-5 py-3">
        <span className="rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-gold">auto free</span>
        <span className="truncate font-mono text-[10.5px] text-faint">routed → gemini-2.5-flash-lite · free</span>
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wider text-faint">0 tokens billed</span>
      </div>
    </div>
  );
}

/* ================= FAQ item ================= */

function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="reveal rounded-2xl border border-line bg-panel transition-colors hover:border-line2" style={{ transitionDelay: `${delay}ms` }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
        <span className={`font-mono text-[11px] font-bold transition-colors ${open ? "text-violet3" : "text-faint"}`}>
          {open ? "−" : "+"}
        </span>
        <span className="flex-1 text-[14.5px] font-bold">{q}</span>
      </button>
      <div className={`faq-body ${open ? "open" : ""}`}>
        <div>
          <p className="px-5 pb-5 pl-[52px] text-[13.5px] leading-relaxed text-dim">{a}</p>
        </div>
      </div>
    </div>
  );
}
