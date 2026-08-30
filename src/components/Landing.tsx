import { useEffect, useMemo, useRef, useState } from "react";
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

export default function Landing({ onStart, onRestore, theme }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  /* scroll reveals (re-run when language changes so fresh nodes animate) */
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
  }, [t]);

  const SCENES = useMemo(
    () => [
      {
        prompt: t("land.scene1p"),
        reply:
          "⏺ Architect · 4 subtasks · 3 specialists\n" +
          "[UI]   + index.html  (86 lines)\n" +
          "[FE]   + timer.js    (41 lines)\n" +
          "[QA]   ✓ build passed · preview is live",
      },
      {
        prompt: t("land.scene2p"),
        reply:
          "Retrieval-Augmented Generation: the model looks up\n" +
          "relevant chunks in a vector index first, then answers\n" +
          "grounded in them — memory you can point to.",
      },
      {
        prompt: t("land.scene3p"),
        reply: "→ en · Good evening, colleague\n🔊 spoken aloud · auto-detected",
      },
    ],
    [t]
  );

  const TICKER = useMemo(
    () => [
      t("land.tick.routing"), t("land.tick.local"), t("land.tick.catalog"), t("land.tick.free"),
      ...PROVIDERS.map((p) => p.name),
      t("land.tick.did"), t("land.tick.zero"), t("land.tick.offline"),
    ],
    [t]
  );

  const FAQS = useMemo(
    () => [1, 2, 3, 4, 5].map((i) => ({ q: t(`land.faq${i}q`), a: t(`land.faq${i}a`) })),
    [t]
  );

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
        <div className="mx-auto flex h-[58px] max-w-[1120px] items-center gap-3 px-4 sm:px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="max-[380px]:hidden"><Wordmark className="text-[17px]" /></span>
          </a>
          <nav className="ml-6 hidden items-center gap-6 text-[13px] font-bold text-dim md:flex">
            <a href="#studio" className="transition-colors hover:text-text">{t("land.navStudio")}</a>
            <a href="#coder" className="transition-colors hover:text-text">{t("land.navCoder")}</a>
            <a href="#privacy" className="transition-colors hover:text-text">{t("land.navPrivacy")}</a>
            <a href="#faq" className="transition-colors hover:text-text">{t("land.navFaq")}</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onRestore}
              className="hidden rounded-xl px-2.5 py-2 text-[13px] font-bold text-dim transition-colors hover:text-text sm:px-3.5 sm:block"
            >
              {t("land.signIn")}
            </button>
            <button onClick={onRestore} className="row-hl rounded-xl border border-line p-2 text-dim sm:hidden" title={t("land.signIn")} aria-label={t("land.signIn")}>
              <KeyIcon className="h-4 w-4" />
            </button>
            <ThemeToggle mode={theme.mode} setMode={theme.setMode} />
            <LangPicker />
            <button onClick={onStart} className="btn-brand hidden rounded-xl px-4 py-2 text-[13px] font-extrabold sm:block">
              {t("land.getStarted")}
            </button>
            <button onClick={onStart} className="btn-brand rounded-xl p-2 sm:hidden" aria-label={t("land.getStarted")}>
              <BoltIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- hero: the terminal IS the product ---------- */}
      <section id="top" className="relative mx-auto grid max-w-[1120px] items-center gap-10 px-4 pb-14 pt-10 sm:px-5 lg:grid-cols-[1.05fr_1fr] lg:pb-16 lg:pt-20">
        <div>
          <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-violet3">
            <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.kicker")}
          </p>
          <h1 className="font-display text-[clamp(30px,5.4vw,62px)] font-bold leading-[1.05] tracking-tight">
            <span className="mask-line"><span style={{ animationDelay: "0.05s" }}>{t("land.hero1")}</span></span>
            <span className="mask-line"><span style={{ animationDelay: "0.18s" }}>{t("land.hero2")}</span></span>
            <span className="mask-line">
              <span style={{ animationDelay: "0.31s" }} className="text-violet2">
                {t("land.hero3")}<span className="wm-cursor">_</span>
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[15px] leading-relaxed text-dim sm:text-[15.5px]">{t("land.heroSub")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onStart} className="cta-sheen btn-brand flex items-center gap-2 rounded-2xl px-5 py-3.5 text-[14.5px] font-extrabold sm:px-6 sm:text-[15px]">
              <BoltIcon className="h-4.5 w-4.5" />
              {t("land.ctaCreate")}
            </button>
            <button
              onClick={onRestore}
              className="flex items-center gap-2 rounded-2xl border border-line2 px-4 py-3.5 text-[13.5px] font-bold text-dim transition-all hover:border-violet/50 hover:text-text sm:px-5 sm:text-[14px]"
            >
              <KeyIcon className="h-4 w-4" />
              {t("land.ctaRestore")}
            </button>
          </div>
          <p className="mt-6 font-mono text-[10.5px] leading-relaxed tracking-wide text-faint sm:text-[11px]">{t("land.trust")}</p>
        </div>

        {/* live terminal */}
        <div className="relative">
          <TerminalDemo scenes={SCENES} t={t} />
          {/* floating proof chips */}
          <div className="floaty absolute -left-5 -top-5 hidden rounded-xl border border-line2 bg-panel px-3 py-2 shadow-xl sm:block" style={{ animationDelay: "0.4s" }}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> catalog · live
            </p>
          </div>
          <div className="floaty absolute -bottom-5 -right-4 hidden rounded-xl border border-line2 bg-panel px-3 py-2 shadow-xl sm:block" style={{ animationDelay: "1.1s" }}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gold">
              <KeyIcon className="h-3 w-3" /> did:key
            </p>
          </div>
        </div>
      </section>

      {/* ---------- ticker ---------- */}
      <section className="border-y border-line bg-panel/40 py-4">
        <div className="marquee">
          <div className="marquee-track">
            {[...TICKER, ...TICKER].map((tick, i) => (
              <span key={i} className="flex shrink-0 items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-faint">
                <span className="text-violet3">✦</span> {tick}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- three modes, one bento ---------- */}
      <section id="studio" className="mx-auto max-w-[1120px] px-4 py-14 sm:px-5 lg:py-20">
        <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="overline mb-3">{t("land.studioOverline")}</p>
            <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight tracking-tight">
              {t("land.studioTitle1")}<br />
              <span className="text-violet2">{t("land.studioTitle2")}</span>
            </h2>
          </div>
          <p className="max-w-[380px] text-[14px] leading-relaxed text-dim">{t("land.studioSub")}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Coder — the big one, with the pipeline */}
          <article id="coder" className="corners reveal group relative overflow-hidden rounded-3xl border border-line bg-panel p-6 transition-all hover:-translate-y-1 hover:border-violet/40 sm:p-7 lg:col-span-2 lg:row-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                <CodeIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{t("land.coderKicker")}</p>
                <h3 className="text-[20px] font-extrabold">{t("land.coderTitle")}</h3>
              </div>
            </div>
            <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-dim">{t("land.coderBody")}</p>

            {/* pipeline */}
            <div className="mt-8 flex flex-wrap items-center gap-x-0 gap-y-4">
              {[
                { s: "ARCH", c: "#ffc24b", k: "land.pipe.decompose" },
                { s: "UI", c: "#5ac8e8", k: "land.pipe.ui" },
                { s: "FE", c: "#31e5ae", k: "land.pipe.fe" },
                { s: "DOC", c: "#c9a0ff", k: "land.pipe.doc" },
                { s: "QA", c: "#ff8a5c", k: "land.pipe.qa" },
              ].map((r, i, arr) => (
                <div key={r.s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-10 w-14 items-center justify-center rounded-xl border font-mono text-[10px] font-bold tracking-wider transition-transform group-hover:scale-105"
                      style={{ color: r.c, borderColor: r.c + "55", background: r.c + "10" }}
                    >
                      {r.s}
                    </span>
                    <span className="mt-1.5 max-w-[90px] text-center font-mono text-[9px] uppercase tracking-wider text-faint">{t(r.k)}</span>
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
              <p className="text-text">❯ “{t("coder.placeholder")}”</p>
              <p className="text-cyanic">[UI] + index.html (142 lines)</p>
              <p className="text-mint">[QA] ✓ preview is live ↗</p>
            </div>
          </article>

          {/* Chat */}
          <article className="corners reveal group rounded-3xl border border-line bg-panel p-6 transition-all hover:-translate-y-1 hover:border-violet/40 sm:p-7" style={{ transitionDelay: "80ms" }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/12 text-violet2">
              <ChatIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{t("land.chatKicker")}</p>
            <h3 className="mt-1 text-[18px] font-extrabold">{t("land.chatTitle")}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">{t("land.chatBody")}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["land.tag.stream", "land.tag.think", "land.tag.search", "land.tag.deep", "land.tag.voice"].map((k) => (
                <span key={k} className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-faint transition-colors group-hover:border-line2 group-hover:text-dim">
                  {t(k)}
                </span>
              ))}
            </div>
          </article>

          {/* Translate */}
          <article className="corners reveal group rounded-3xl border border-line bg-panel p-6 transition-all hover:-translate-y-1 hover:border-violet/40 sm:p-7" style={{ transitionDelay: "160ms" }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyanic/12 text-cyanic">
              <TranslateIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{t("land.trKicker")}</p>
            <h3 className="mt-1 text-[18px] font-extrabold">{t("land.trTitle")}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">{t("land.trBody")}</p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10.5px] text-faint">
              <MicIcon className="h-3.5 w-3.5 text-cyanic" /> {t("land.trPtt")}
              <span className="text-line2">|</span>
              <GlobeIcon className="h-3.5 w-3.5 text-gold" /> {t("land.trAd")}
            </div>
          </article>
        </div>
      </section>

      {/* ---------- numbers ---------- */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-5 md:grid-cols-4 lg:py-12">
          {[
            { n: t("land.stat1n"), l: t("land.stat1l") },
            { n: t("land.stat2n"), l: t("land.stat2l") },
            { n: t("land.stat3n"), l: t("land.stat3l") },
            { n: t("land.stat4n"), l: t("land.stat4l") },
          ].map((s, i) => (
            <div key={i} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <p className="font-display text-[clamp(26px,3vw,38px)] font-bold text-violet2">{s.n}</p>
              <p className="mt-1 text-[12.5px] font-semibold text-dim">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- privacy / DID ---------- */}
      <section id="privacy" className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 py-14 sm:px-5 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="reveal">
          <p className="overline mb-3">{t("land.privOverline")}</p>
          <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight tracking-tight">
            {t("land.privTitle1")}<br />
            <span className="text-violet2">{t("land.privTitle2")}</span>
          </h2>
          <ul className="mt-7 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-mint/12 text-mint">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[14.5px] font-bold">{t(`land.priv${i}t`)}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{t(`land.priv${i}d`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* DID card */}
        <div className="reveal" style={{ transitionDelay: "120ms" }}>
          <div className="corners relative overflow-hidden rounded-3xl border border-line2 bg-panel p-6 shadow-[0_30px_80px_-40px_rgba(97,92,237,0.5)] sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <div>
                  <p className="text-[13px] font-extrabold">{t("land.cardTitle")}</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">{t("land.cardSub")}</p>
                </div>
              </div>
              <span className="rounded-full border border-mint/40 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-mint">
                {t("land.cardActive")}
              </span>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-ink p-4">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">did:key</p>
              <p className="mt-1.5 break-all font-mono text-[12px] leading-relaxed text-violet3">
                did:key:zDnaerx9CtbqGq9HPXtVXb2m8JqYfZ7sLp4WvN3kR5tU8yB1c
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
              {[
                [t("land.cardCurve"), "P-256"],
                [t("land.cardProof"), t("land.cardProofV")],
                [t("land.cardStorage"), t("land.cardStorageV")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line bg-panel2 px-3 py-2.5">
                  <p className="uppercase tracking-wider text-faint">{k}</p>
                  <p className="mt-0.5 break-words text-text">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-center font-mono text-[10.5px] text-faint">
              {t("land.cardNote")}
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-[760px] px-4 py-14 sm:px-5 lg:py-20">
        <p className="overline mb-3 reveal">{t("land.faqOverline")}</p>
        <h2 className="reveal mb-8 font-display text-[clamp(24px,3.4vw,36px)] font-bold tracking-tight">
          {t("land.faqTitle")}
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative overflow-hidden border-t border-line bg-panel/50">
        <div className="absolute inset-0 opacity-[0.35]" aria-hidden>
          <div className="tint tint-mint" style={{ top: "-160px", right: "-80px" }} />
        </div>
        <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-4 py-14 text-center sm:px-5 lg:py-20">
          <BrandMark className="floaty h-12 w-12 drop-shadow-[0_0_30px_#615ced66]" />
          <h2 className="reveal mt-6 font-display text-[clamp(26px,4vw,44px)] font-bold leading-tight tracking-tight">
            {t("land.finalA")} <span className="text-violet2">{t("land.finalB")}</span> {t("land.finalC")}
          </h2>
          <p className="reveal mt-3 max-w-[440px] text-[14.5px] text-dim">{t("land.finalSub")}</p>
          <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={onStart} className="cta-sheen btn-brand flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14.5px] font-extrabold sm:px-7 sm:text-[15px]">
              <BoltIcon className="h-4.5 w-4.5" />
              {t("land.ctaCreate")}
            </button>
            <button
              onClick={onRestore}
              className="flex items-center gap-2 rounded-2xl border border-line2 px-5 py-3.5 text-[14px] font-bold text-dim transition-all hover:border-violet/50 hover:text-text"
            >
              <KeyIcon className="h-4 w-4" /> {t("land.signIn")}
            </button>
          </div>
          <p className="reveal mt-5 font-mono text-[10.5px] text-faint">{t("land.finalNote")}</p>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-7 sm:px-5">
          <span className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <Wordmark className="text-[14px]" />
          </span>
          <span className="font-mono text-[10.5px] text-faint">{t("land.footerRights")}</span>
          <span className="ml-auto font-mono text-[10.5px] text-faint">
            {t("land.footerMadeA")} <span className="text-violet3">&gt;_</span> {t("land.footerMadeB")}
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ================= living terminal ================= */

function TerminalDemo({ scenes, t }: { scenes: { prompt: string; reply: string }[]; t: (k: string) => string }) {
  const [scene, setScene] = useState(0);
  const [stage, setStage] = useState<"prompt" | "gap" | "reply" | "wait">("prompt");
  const [pLen, setPLen] = useState(0);
  const [rLen, setRLen] = useState(0);
  const tick = useRef(0);

  const sc = scenes[scene % scenes.length];

  /* reset typing when scenes change (language switch) */
  useEffect(() => {
    setPLen(0);
    setRLen(0);
    setStage("prompt");
  }, [scenes]);

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
          setScene((s) => (s + 1) % scenes.length);
          setPLen(0);
          setRLen(0);
          setStage("prompt");
        }
      }
    }, 26);
    return () => window.clearInterval(id);
  }, [stage, scene, sc, scenes.length]);

  const replyShown = sc.reply.slice(0, rLen);

  return (
    <div className="overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.75 }} />
        ))}
        <span className="ml-2 font-mono text-[11px] text-faint">aide — studio</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-mint">
          <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> {t("land.termLive")}
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
        <span className="truncate font-mono text-[10.5px] text-faint">{t("land.termRouted")} → gemini-2.5-flash-lite · {t("common.free")}</span>
        <span className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-wider text-faint sm:block">{t("land.termBilled")}</span>
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
