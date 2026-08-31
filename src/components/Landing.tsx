import { useEffect, useMemo, useRef, useState } from "react";
import { PROVIDERS } from "../data/providers";
import {
  BrandMark, Wordmark, ChatIcon, CodeIcon, TranslateIcon, KeyIcon, CheckIcon,
  GlobeIcon, MicIcon, BoltIcon, Seal, Tryzub,
} from "./Icons";
import { ThemeToggle, LangPicker } from "./Appearance";
import { useI18n } from "../lib/i18n";
import type { ThemeMode } from "../lib/theme";

/* Landing page — shown to everyone without a DID identity.
   "Get started" → registration (DID creation) → full app access.
   "Sign in"     → restore an existing identity from backup. */

interface Props {
  onStart: () => void;
  onRestore: () => void;
  theme: { mode: ThemeMode; setMode: (m: ThemeMode) => void };
}

export default function Landing({ onStart, onRestore, theme }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  /* scroll reveals (re-run on language change) */
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
      { prompt: t("land.scene1p"), reply: t("land.scene1r") },
      { prompt: t("land.scene2p"), reply: t("land.scene2r") },
      { prompt: t("land.scene3p"), reply: t("land.scene3r") },
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

  const FAQS = useMemo(() => [1, 2, 3, 4, 5].map((i) => ({ q: t(`land.faq${i}q`), a: t(`land.faq${i}a`) })), [t]);

  return (
    <div ref={rootRef} className="relative h-dvh overflow-y-auto overflow-x-clip bg-bg text-text">
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
            {lang === "zh" && <Seal ch="智" className="h-6 w-6 text-[11px] max-sm:hidden" />}
            {lang === "uk" && <Tryzub className="h-6 w-6 max-sm:hidden" />}
          </a>
          <nav className="ms-6 hidden items-center gap-6 text-[13px] font-bold text-dim md:flex">
            <a href="#studio" className="transition-colors hover:text-text">{t("land.navStudio")}</a>
            <a href="#coder" className="transition-colors hover:text-text">{t("land.navCoder")}</a>
            <a href="#privacy" className="transition-colors hover:text-text">{t("land.navPrivacy")}</a>
            <a href="#faq" className="transition-colors hover:text-text">{t("land.navFaq")}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
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
          <p className="mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet3">
            <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.kicker")}
            {lang === "zh" && <Seal ch="智" className="ms-1 h-7 w-7 text-[13px]" />}
            {lang === "uk" && <Tryzub className="ms-1 h-7 w-7" />}
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

        <HeroTerminal scenes={SCENES} />
      </section>

      {/* ---------- ticker ---------- */}
      <div className="border-y border-line bg-panel/60 py-3">
        <div className="overflow-hidden" dir="ltr">
          <div className="ticker">
            {[0, 1].map((n) => (
              <div key={n} className="flex shrink-0 items-center">
                {TICKER.map((item, i) => (
                  <span key={i} className="flex items-center gap-3 pe-3 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                    <span className="text-violet3">✦</span> {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- stats ---------- */}
      <section className="mx-auto max-w-[1120px] px-4 py-12 sm:px-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { n: t("land.stat1n"), l: t("land.stat1l") },
            { n: t("land.stat2n"), l: t("land.stat2l") },
            { n: t("land.stat3n"), l: t("land.stat3l") },
            { n: t("land.stat4n"), l: t("land.stat4l") },
          ].map((s, i) => (
            <div key={i} className="reveal rounded-2xl border border-line bg-panel/70 p-5" style={{ transitionDelay: `${i * 70}ms` }}>
              <p className="font-display text-[26px] font-bold text-violet2 sm:text-[30px]">{s.n}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-dim">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- the studio: three asymmetric mode cards ---------- */}
      <section id="studio" className="mx-auto max-w-[1120px] scroll-mt-16 px-4 py-10 sm:px-5">
        <p className="reveal overline">{t("land.studioOverline")}</p>
        <h2 className="reveal mt-3 max-w-[640px] font-display text-[clamp(24px,3.6vw,40px)] font-bold leading-tight">
          {t("land.studioTitle1")} <span className="text-violet2">{t("land.studioTitle2")}</span>
        </h2>
        <p className="reveal mt-3 max-w-[560px] text-[14.5px] leading-relaxed text-dim">{t("land.studioSub")}</p>

        <div className="mt-8 grid gap-3.5 lg:grid-cols-12">
          {/* chat — wide card */}
          <div className="reveal group relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-6 transition-all hover:-translate-y-1 hover:border-violet/40 lg:col-span-7">
            <span className="corners pointer-events-none absolute inset-0" />
            <p className="overline">{t("land.chatKicker")}</p>
            <h3 className="mt-3 font-display text-[20px] font-bold sm:text-[22px]">{t("land.chatTitle")}</h3>
            <p className="mt-2.5 max-w-[440px] text-[13.5px] leading-relaxed text-dim">{t("land.chatBody")}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {[t("land.tag.stream"), t("land.tag.think"), t("land.tag.search"), t("land.tag.deep"), t("land.tag.voice")].map((tag) => (
                <span key={tag} className="rounded-full border border-line2 bg-panel2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim">
                  {tag}
                </span>
              ))}
            </div>
            <ChatIcon className="pointer-events-none absolute -bottom-4 -end-4 h-32 w-32 text-violet/10 transition-transform duration-500 group-hover:scale-110" />
          </div>

          {/* coder — tall card */}
          <div id="coder" className="reveal group relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-6 transition-all hover:-translate-y-1 hover:border-violet/40 lg:col-span-5 lg:row-span-2">
            <span className="corners pointer-events-none absolute inset-0" />
            <p className="overline">{t("land.coderKicker")}</p>
            <h3 className="mt-3 font-display text-[20px] font-bold sm:text-[22px]">{t("land.coderTitle")}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">{t("land.coderBody")}</p>
            {/* pipeline */}
            <div className="mt-6 space-y-2">
              {[
                { k: t("land.pipe.decompose"), c: "#ffc24b", w: "w-full" },
                { k: t("land.pipe.ui"), c: "#58c4dd", w: "w-[88%]" },
                { k: t("land.pipe.fe"), c: "#8b7cff", w: "w-[80%]" },
                { k: t("land.pipe.doc"), c: "#c9a0ff", w: "w-[58%]" },
                { k: t("land.pipe.qa"), c: "#3ecf8e", w: "w-[72%]" },
              ].map((st, i) => (
                <div key={i} className={`flex items-center gap-2 ${st.w}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: st.c }} />
                  <span className="h-7 flex-1 rounded-lg border border-line bg-panel2/80 px-3 text-[11.5px] font-bold leading-7 text-dim transition-colors group-hover:text-text">
                    {st.k}
                  </span>
                </div>
              ))}
            </div>
            <CodeIcon className="pointer-events-none absolute -bottom-5 -end-5 h-36 w-36 text-violet/10 transition-transform duration-500 group-hover:scale-110" />
          </div>

          {/* translate — wide card */}
          <div className="reveal group relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-6 transition-all hover:-translate-y-1 hover:border-violet/40 lg:col-span-7">
            <span className="corners pointer-events-none absolute inset-0" />
            <p className="overline">{t("land.trKicker")}</p>
            <h3 className="mt-3 font-display text-[20px] font-bold sm:text-[22px]">{t("land.trTitle")}</h3>
            <p className="mt-2.5 max-w-[440px] text-[13.5px] leading-relaxed text-dim">{t("land.trBody")}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {[t("land.trPtt"), t("land.trAd"), "60+ 🌐", "🔊"].map((tag) => (
                <span key={tag} className="rounded-full border border-line2 bg-panel2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim">
                  {tag}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute -bottom-4 -end-4 flex gap-2 opacity-25 transition-opacity duration-500 group-hover:opacity-40">
              <TranslateIcon className="h-14 w-14 text-cyanic" />
              <MicIcon className="h-14 w-14 text-violet3" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- privacy + identity card ---------- */}
      <section id="privacy" className="mx-auto max-w-[1120px] scroll-mt-16 px-4 py-12 sm:px-5">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="reveal overline">{t("land.privOverline")}</p>
            <h2 className="reveal mt-3 font-display text-[clamp(24px,3.6vw,40px)] font-bold leading-tight">
              {t("land.privTitle1")} <span className="text-violet2">{t("land.privTitle2")}</span>
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { t: t("land.priv1t"), d: t("land.priv1d") },
                { t: t("land.priv2t"), d: t("land.priv2d") },
                { t: t("land.priv3t"), d: t("land.priv3d") },
                { t: t("land.priv4t"), d: t("land.priv4d") },
              ].map((c, i) => (
                <div key={i} className="reveal rounded-2xl border border-line bg-panel/70 p-5 transition-all hover:-translate-y-0.5 hover:border-violet/35" style={{ transitionDelay: `${i * 60}ms` }}>
                  <p className="flex items-center gap-2 text-[14px] font-extrabold">
                    <CheckIcon className="h-4 w-4 text-mint" /> {c.t}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-dim">{c.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DID card */}
          <div className="reveal anim-none relative mx-auto w-full max-w-[360px]">
            <div className="floaty rounded-3xl border border-line2 bg-gradient-to-b from-panel2 to-panel p-6 shadow-[0_30px_70px_-30px_var(--t-shadow)]">
              <div className="flex items-center justify-between">
                <BrandMark className="h-9 w-9" />
                <span className="flex items-center gap-1.5 rounded-full border border-mint/40 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-mint">
                  <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> {t("land.cardActive")}
                </span>
              </div>
              <p className="mt-5 text-[15px] font-extrabold">{t("land.cardTitle")}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t("land.cardSub")}</p>
              <div className="mt-4 rounded-xl bg-ink p-3.5 font-mono text-[11.5px] leading-relaxed text-violet3 ltr-keep">
                did:key:z6Mk<span className="text-faint">…</span>9fQa2
                <span className="caret ms-1" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10.5px]">
                <span className="text-faint">{t("land.cardCurve")}</span>
                <span className="text-end text-dim">ECDSA P-256</span>
                <span className="text-faint">{t("land.cardProof")}</span>
                <span className="text-end text-dim">{t("land.cardProofV")}</span>
                <span className="text-faint">{t("land.cardStorage")}</span>
                <span className="text-end text-dim">{t("land.cardStorageV")}</span>
              </div>
              <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] italic text-faint">{t("land.cardNote")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-[760px] scroll-mt-16 px-4 py-12 sm:px-5">
        <p className="reveal overline">{t("land.faqOverline")}</p>
        <h2 className="reveal mt-3 font-display text-[clamp(22px,3.2vw,34px)] font-bold">{t("land.faqTitle")}</h2>
        <div className="mt-6 space-y-2.5">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative mx-auto max-w-[1120px] px-4 pb-16 pt-6 text-center sm:px-5">
        <div className="reveal rounded-3xl border border-line2 bg-panel/70 px-6 py-12">
          <p className="font-display text-[clamp(24px,4vw,44px)] font-bold leading-tight">
            {t("land.finalA")} <span className="text-violet2">{t("land.finalB")}</span> {t("land.finalC")}
          </p>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-relaxed text-dim">{t("land.finalSub")}</p>
          <button onClick={onStart} className="cta-sheen btn-brand mx-auto mt-7 flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-extrabold">
            <BoltIcon className="h-4.5 w-4.5" />
            {t("land.ctaCreate")}
          </button>
          <p className="mt-4 font-mono text-[10.5px] text-faint">{t("land.finalNote")}</p>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-4 py-6 sm:px-5">
          <BrandMark className="h-6 w-6" />
          <span className="font-mono text-[10.5px] text-faint">{t("land.footerRights")}</span>
          <span className="ms-auto font-mono text-[10.5px] text-faint">
            {t("land.footerMadeA")} <span className="text-violet3">&gt;_</span> {t("land.footerMadeB")}
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- hero terminal with typing demo ---------- */

function HeroTerminal({ scenes }: { scenes: { prompt: string; reply: string }[] }) {
  const { t } = useI18n();
  const [scene, setScene] = useState(0);
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState<string[]>([]);
  const [phase, setPhase] = useState<"typing" | "thinking" | "reply" | "hold">("typing");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const s = scenes[scene];
    setTyped("");
    setReply([]);
    setPhase("typing");
    timers.current.forEach(clearTimeout);
    timers.current = [];

    let i = 0;
    const typeStep = () => {
      i++;
      setTyped(s.prompt.slice(0, i));
      if (i < s.prompt.length) {
        timers.current.push(window.setTimeout(typeStep, 34));
      } else {
        setPhase("thinking");
        timers.current.push(
          window.setTimeout(() => {
            setPhase("reply");
            const lines = s.reply.split("\n");
            lines.forEach((_, li) => {
              timers.current.push(
                window.setTimeout(() => {
                  setReply(lines.slice(0, li + 1));
                  if (li === lines.length - 1) {
                    setPhase("hold");
                    timers.current.push(window.setTimeout(() => setScene((v) => (v + 1) % scenes.length), 2600));
                  }
                }, li * 320)
              );
            });
          }, 650)
        );
      }
    };
    timers.current.push(window.setTimeout(typeStep, 500));
    return () => timers.current.forEach(clearTimeout);
  }, [scene, scenes]);

  return (
    <div className="reveal relative">
      <div className="overflow-hidden rounded-2xl border border-line2 bg-ink shadow-[0_40px_90px_-30px_var(--t-shadow)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.75 }} />
          ))}
          <span className="ms-2 font-mono text-[11px] text-faint">aide — studio</span>
          <span className="ms-auto flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-mint">
            <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> {t("land.termLive")}
          </span>
        </div>
        <div className="term-scan relative min-h-[230px] p-4 font-mono text-[12.5px] leading-relaxed ltr-keep" dir="ltr">
          <p className="text-text">
            <span className="text-violet3">➜</span> <span className="text-faint">~</span>{" "}
            <span className="text-dim">{typed}</span>
            {phase === "typing" && <span className="caret" />}
          </p>
          {phase === "thinking" && (
            <p className="mt-2 flex items-center gap-1.5 text-violet3">
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            </p>
          )}
          <div className="mt-2">
            {reply.map((l, i) => (
              <p key={i} className={`term-line whitespace-pre-wrap ${l.startsWith("⏺") ? "text-violet3" : l.includes("✓") ? "text-mint" : l.startsWith("[") ? "text-cyanic" : "text-dim"}`}>
                {l}
              </p>
            ))}
            {phase === "reply" && <span className="caret" />}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 font-mono text-[10px] text-faint">
          <span className="text-mint">● {t("land.termRouted")}</span>
          <span className="ms-auto">{t("land.termBilled")}</span>
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-violet/10 blur-2xl" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`reveal overflow-hidden rounded-2xl border transition-colors ${open ? "border-violet/40 bg-panel" : "border-line bg-panel/60 hover:border-line2"}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-start">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line text-[13px] font-bold transition-transform duration-300 ${open ? "rotate-45 border-violet/50 text-violet3" : "text-dim"}`}>
          +
        </span>
        <span className="text-[14.5px] font-bold">{q}</span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 ps-14 text-[13.5px] leading-relaxed text-dim">{a}</p>
        </div>
      </div>
    </div>
  );
}
