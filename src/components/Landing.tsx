import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { BrandMark, Wordmark, MicIcon, SpeakerIcon, TokenIcon, KeyIcon, CheckIcon, BoltIcon, GlobeIcon, Seal, Tryzub } from "./Icons";
import { ThemeToggle, LangPicker } from "./Appearance";
import type { ThemeMode } from "../lib/theme";

interface Props {
  onStart: () => void;
  onRestore: () => void;
  theme: { mode: ThemeMode; setMode: (m: ThemeMode) => void };
}

/* ---------- scroll reveal ---------- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>(".rv");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("on");
            io.unobserve(e.target);
          }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------- count-up ---------- */
function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setV(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/* ---------- live interpreter demo ---------- */
function InterpreterDemo() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const turns = [
    { side: "A" as const, text: t("land.demoA1"), tr: t("land.demoA1t") },
    { side: "B" as const, text: t("land.demoB1"), tr: t("land.demoB1t") },
    { side: "A" as const, text: t("land.demoA2"), tr: t("land.demoA2t") },
    { side: "B" as const, text: t("land.demoB2"), tr: t("land.demoB2t") },
  ];
  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i >= turns.length + 2 ? 0 : i + 1)), 1500);
    return () => window.clearInterval(id);
  }, [turns.length]);
  const shown = turns.slice(0, Math.min(idx, turns.length));
  const listening = idx < turns.length ? turns[idx]?.side : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_30px_80px_-30px_var(--t-shadow)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="pulse-live h-2 w-2 rounded-full bg-mint" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">{t("land.demoListen")}</span>
        <span className="ms-auto flex items-center gap-1.5 font-mono text-[10.5px] text-violet3">
          <SpeakerIcon className="h-3.5 w-3.5" /> {t("land.demoArrow")}
        </span>
      </div>

      <div className="flex h-[264px] flex-col justify-end gap-2.5 overflow-hidden p-4">
        {shown.length === 0 && (
          <p className="pb-10 text-center font-mono text-[11.5px] text-faint">{t("land.demoWaiting")}</p>
        )}
        {shown.map((tn, i) => (
          <div
            key={i}
            className={`step-in max-w-[86%] rounded-2xl border p-3 ${
              tn.side === "A" ? "me-auto border-cyanic/30 bg-cyanic/8" : "ms-auto border-gold/30 bg-gold/8"
            }`}
          >
            <p className={`font-mono text-[9.5px] font-bold uppercase tracking-wider ${tn.side === "A" ? "text-cyanic" : "text-gold"}`}>
              {tn.side === "A" ? t("land.demoSideA") : t("land.demoSideB")}
            </p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug">{tn.text}</p>
            <p className="mt-1 border-t border-line/70 pt-1 text-[12.5px] leading-snug text-dim">→ {tn.tr}</p>
          </div>
        ))}
        {listening && (
          <div className={`step-in flex items-center gap-2 ${listening === "A" ? "me-auto" : "ms-auto"}`}>
            <span className={`mic-ripples relative flex h-8 w-8 items-center justify-center rounded-full border ${listening === "A" ? "border-cyanic/50 text-cyanic" : "border-gold/50 text-gold"}`}>
              <span /><span />
              <MicIcon className="h-3.5 w-3.5" />
            </span>
            <span className="caret" />
          </div>
        )}
      </div>

      <p className="border-t border-line px-4 py-2.5 text-center font-mono text-[10px] text-faint">{t("land.demoLoop")}</p>
    </div>
  );
}

/* ---------- studio terminal demo ---------- */
function TerminalDemo() {
  const { t } = useI18n();
  const scenes = [
    { p: t("land.scene1p"), r: t("land.scene1r") },
    { p: t("land.scene2p"), r: t("land.scene2r") },
    { p: t("land.scene3p"), r: t("land.scene3r") },
  ];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 420);
    return () => window.clearInterval(id);
  }, []);
  const per = 16;
  const scene = scenes[Math.floor(tick / per) % scenes.length];
  const lines = scene.r.split("\n");
  const shownLines = lines.slice(0, Math.max(0, (tick % per) - 2));

  return (
    <div className="term-scan relative overflow-hidden rounded-3xl border border-line2 bg-ink shadow-[0_30px_80px_-30px_var(--t-shadow)]">
      <div className="relative z-10 flex items-center gap-1.5 border-b border-line px-4 py-2.5">
        {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full opacity-75" style={{ background: c }} />
        ))}
        <span className="ms-2 font-mono text-[11px] text-faint">{t("land.termTitle")}</span>
        <span className="ms-auto rounded border border-mint/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
          {t("land.termLive")}
        </span>
      </div>
      <div className="relative z-10 h-[240px] overflow-hidden p-4 font-mono text-[12.5px] leading-relaxed">
        <p className="text-dim">
          <span className="text-violet3">$</span> <span className="text-text">{scene.p}</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-cyanic" /> {t("land.termRouted")} · pollinations / openai · {t("land.termBilled")}
        </p>
        <div className="mt-3 whitespace-pre-wrap text-[#c9d0e8]">
          {shownLines.map((l, i) => (
            <p key={i} className="term-line">{l}</p>
          ))}
          {shownLines.length < lines.length && <span className="caret" />}
        </div>
      </div>
    </div>
  );
}

/* ---------- FAQ ---------- */
function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: t("land.faq1q"), a: t("land.faq1a") },
    { q: t("land.faq2q"), a: t("land.faq2a") },
    { q: t("land.faq3q"), a: t("land.faq3a") },
    { q: t("land.faq4q"), a: t("land.faq4a") },
    { q: t("land.faq5q"), a: t("land.faq5a") },
  ];
  return (
    <div className="mx-auto max-w-[760px]">
      {items.map((it, i) => (
        <div key={i} className="rv border-b border-line" style={{ transitionDelay: `${i * 60}ms` }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center gap-4 py-5 text-start transition-colors hover:text-violet2"
            aria-expanded={open === i}
          >
            <span className="font-mono text-[11px] font-bold text-faint">0{i + 1}</span>
            <span className="flex-1 text-[15.5px] font-extrabold">{it.q}</span>
            <span className={`text-violet3 transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <p className="pb-5 ps-10 text-[14px] leading-relaxed text-dim">{it.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= landing ================= */

export default function Landing({ onStart, onRestore, theme }: Props) {
  const { t, lang } = useI18n();
  const ref = useReveal();

  const ticks = [
    t("land.tick.providers"), t("land.tick.live"), t("land.tick.did"),
    t("land.tick.zero"), t("land.tick.offline"), t("land.tick.voice"),
  ];

  return (
    <div ref={ref} className="relative min-h-dvh overflow-x-clip">
      <div className="ambient" aria-hidden>
        <div className="dots" />
        <div className="tint tint-mint" />
        <div className="tint tint-gold" />
      </div>

      {/* nav */}
      <nav className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] w-full max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <BrandMark className="h-8 w-8" />
          <Wordmark className="text-[17px]" />
          {lang === "zh" && <Seal ch="译" className="h-6 w-6 text-[12px]" />}
          {lang === "uk" && <Tryzub className="h-6 w-6" />}
          <nav className="ms-6 hidden items-center gap-6 text-[13px] font-bold text-dim lg:flex">
            <a href="#studio" className="transition-colors hover:text-text">{t("land.navStudio")}</a>
            <a href="#linguist" className="transition-colors hover:text-text">{t("land.navLing")}</a>
            <a href="#earn" className="transition-colors hover:text-text">{t("land.navEarn")}</a>
            <a href="#privacy" className="transition-colors hover:text-text">{t("land.navPrivacy")}</a>
            <a href="#faq" className="transition-colors hover:text-text">{t("land.navFaq")}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <LangPicker compact />
            <ThemeToggle mode={theme.mode} setMode={theme.setMode} />
            <button onClick={onRestore} className="row-hl ms-1 hidden rounded-xl px-3 py-2 text-[13px] font-bold text-dim hover:text-text sm:block">
              {t("land.signIn")}
            </button>
            <button onClick={onStart} className="btn-brand rounded-xl px-4 py-2 text-[13px] font-extrabold">
              {t("land.register")}
            </button>
          </div>
        </div>
      </nav>

      {/* hero — split, leads with the live interpreter */}
      <header className="relative mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <p className="rv on mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet3">
            <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.kicker")}
          </p>
          <h1 className="font-display text-[clamp(34px,5.4vw,62px)] font-bold leading-[1.04] tracking-tight">
            <span className="block">{t("land.heroTitle1")}</span>
            <span className="block text-violet2">{t("land.heroTitle2")}</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-[15.5px] leading-relaxed text-dim">{t("land.heroSub")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onStart} className="btn-brand flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14.5px] font-extrabold">
              <BoltIcon className="h-4 w-4" />
              {t("land.ctaStart")}
            </button>
            <button onClick={onRestore} className="row-hl flex items-center gap-2 rounded-2xl border border-line px-5 py-3.5 text-[14px] font-bold text-dim hover:border-line2 hover:text-text">
              <KeyIcon className="h-4 w-4" />
              {t("land.ctaRestore")}
            </button>
          </div>
          <dl className="mt-12 grid max-w-[480px] grid-cols-3 gap-6">
            {[
              { n: t("land.stat1n"), l: t("land.stat1l") },
              { n: t("land.stat2n"), l: t("land.stat2l") },
              { n: t("land.stat3n"), l: t("land.stat3l") },
            ].map((s, i) => (
              <div key={i} className="rv" style={{ transitionDelay: `${i * 90}ms` }}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-[26px] font-bold text-text">{s.n}</dd>
                <dd className="mt-1 text-[11.5px] leading-snug text-faint">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rv on">
          <InterpreterDemo />
        </div>
      </header>

      {/* capability ticker */}
      <div className="tick-mask border-y border-line bg-panel/60 py-3">
        <div className="tick-track">
          {[...ticks, ...ticks, ...ticks].map((c, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 font-mono text-[11px] text-dim">
              <span className="h-1 w-1 rounded-full bg-violet2" />
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* studio */}
      <section id="studio" className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="rv">
          <p className="overline mb-4 text-violet3">{t("land.studioKicker")}</p>
          <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-tight">{t("land.studioTitle")}</h2>
          <p className="mt-5 max-w-[500px] text-[15px] leading-relaxed text-dim">{t("land.studioBody")}</p>
          <ul className="mt-7 space-y-3.5">
            {[t("land.studioFeat1"), t("land.studioFeat2"), t("land.studioFeat3")].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-dim">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet2">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <a href="#faq" className="mt-8 inline-flex items-center gap-2 text-[13.5px] font-extrabold text-violet2 transition-transform hover:translate-x-1">
            {t("land.studioCta")} →
          </a>
        </div>
        <div className="rv" style={{ transitionDelay: "120ms" }}>
          <TerminalDemo />
        </div>
      </section>

      {/* linguist */}
      <section id="linguist" className="border-y border-line bg-panel/40">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="rv order-2 lg:order-1">
            <div className="corners relative rounded-3xl border border-line2 bg-panel p-5 shadow-[0_30px_80px_-30px_var(--t-shadow)]">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex h-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-cyanic/50 bg-cyanic/10">
                  <span className="mic-ripples relative flex h-9 w-9 items-center justify-center rounded-full border border-cyanic/60 text-cyanic">
                    <span /><span />
                    <MicIcon className="h-4 w-4" />
                  </span>
                  <span className="text-[12px] font-extrabold text-cyanic">A · Українська</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-faint">{t("land.demoListen")}</span>
                </div>
                <div className="flex h-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-line bg-panel2">
                  <MicIcon className="h-5 w-5 text-dim" />
                  <span className="text-[12px] font-extrabold text-dim">B · English</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-faint">hold</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="me-auto max-w-[88%] rounded-2xl border border-cyanic/25 bg-cyanic/6 p-3">
                  <p className="text-[13.5px] font-semibold">Привіт! Радий тебе бачити.</p>
                  <p className="mt-1 border-t border-cyanic/15 pt-1 text-[12.5px] text-dim">→ Hi! Great to see you.</p>
                </div>
                <div className="ms-auto max-w-[88%] rounded-2xl border border-gold/25 bg-gold/6 p-3">
                  <p className="text-end text-[13.5px] font-semibold">Shall we grab a coffee?</p>
                  <p className="mt-1 border-t border-gold/15 pt-1 text-end text-[12.5px] text-dim">→ Ходімо на каву?</p>
                </div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] text-faint">
                <SpeakerIcon className="h-3 w-3 text-violet3" /> {t("land.tick.voice")}
              </p>
            </div>
          </div>
          <div className="rv order-1 lg:order-2">
            <p className="overline mb-4 text-cyanic">{t("land.lingKicker")}</p>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              {t("land.lingTitle1")} <span className="text-cyanic">{t("land.lingTitle2")}</span>
            </h2>
            <p className="mt-5 max-w-[500px] text-[15px] leading-relaxed text-dim">{t("land.lingBody")}</p>
            <ul className="mt-7 space-y-3.5">
              {[t("land.lingFeat1"), t("land.lingFeat2"), t("land.lingFeat3")].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-dim">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyanic/15 text-cyanic">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#earn" className="mt-8 inline-flex items-center gap-2 text-[13.5px] font-extrabold text-cyanic transition-transform hover:translate-x-1">
              {t("land.lingCta")} →
            </a>
          </div>
        </div>
      </section>

      {/* earn — AIDE economy */}
      <section id="earn" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 start-1/4 h-[420px] w-[420px] rounded-full opacity-60" style={{ background: "radial-gradient(circle, var(--t-glow-b), transparent 65%)" }} />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-28">
          {/* token card */}
          <div className="rv">
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-panel p-6 shadow-[0_30px_90px_-30px_var(--t-shadow)]">
              <div className="flex items-center gap-4">
                <span className="floaty"><TokenIcon className="h-14 w-14" /></span>
                <div>
                  <p className="font-display text-[22px] font-bold tracking-tight">AIDE</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gold">{t("land.earnKicker")}</p>
                </div>
                <span className="ms-auto rounded-full border border-mint/40 bg-mint/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-mint">
                  {t("land.termLive")}
                </span>
              </div>
              <p className="mt-5 text-[14px] leading-relaxed text-dim">{t("land.earnBody")}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { v: <CountUp to={1} suffix="B" />, l: t("land.earnSupply") },
                  { v: <CountUp to={4218} />, l: t("land.earnLing") },
                  { v: <CountUp to={38.9} decimals={1} suffix="k" />, l: t("land.earnSess") },
                  { v: <CountUp to={6} suffix=" Ⓐ" />, l: t("land.earnAvg") },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-panel2/70 px-3 py-3">
                    <p className="font-display text-[17px] font-bold text-gold">{s.v}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">{s.l}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t("land.earnTicker")}</p>
              <div className="tick-mask mt-2">
                <div className="tick-track" style={{ animationDuration: "26s" }}>
                  {[
                    "+12 Ⓐ · Oksana · uk⇄en", "+8 Ⓐ · Yuki · ja⇄zh", "+15 Ⓐ · Layla · ar⇄fr",
                    "+6 Ⓐ · Mateo · es⇄pt", "+10 Ⓐ · Amara · sw⇄en", "+9 Ⓐ · Chen · yue⇄en",
                  ].concat([
                    "+12 Ⓐ · Oksana · uk⇄en", "+8 Ⓐ · Yuki · ja⇄zh", "+15 Ⓐ · Layla · ar⇄fr",
                    "+6 Ⓐ · Mateo · es⇄pt", "+10 Ⓐ · Amara · sw⇄en", "+9 Ⓐ · Chen · yue⇄en",
                  ]).map((r, i) => (
                    <span key={i} className="shrink-0 rounded-full border border-line bg-ink px-3 py-1 font-mono text-[11px] text-mint">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 rounded-xl border border-line bg-ink/60 px-3.5 py-2.5 font-mono text-[10.5px] text-faint">
                {t("land.earnNoKyc")}
              </p>
            </div>
          </div>

          {/* ways to earn */}
          <div className="rv" style={{ transitionDelay: "120ms" }}>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-tight">{t("land.earnTitle")}</h2>
            <div className="mt-8">
              {[
                { n: "01", tt: t("land.earnWay1t"), d: t("land.earnWay1d"), icon: <MicIcon className="h-4 w-4" /> },
                { n: "02", tt: t("land.earnWay2t"), d: t("land.earnWay2d"), icon: <CheckIcon className="h-4 w-4" /> },
                { n: "03", tt: t("land.earnWay3t"), d: t("land.earnWay3d"), icon: <GlobeIcon className="h-4 w-4" /> },
              ].map((w, i) => (
                <div key={i} className="rv group flex gap-5 border-b border-line py-6 transition-colors first:border-t hover:bg-panel/50" style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="font-mono text-[12px] font-bold text-faint transition-colors group-hover:text-gold">{w.n}</span>
                  <div className="flex-1">
                    <p className="flex items-center gap-2.5 text-[16px] font-extrabold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/12 text-gold">{w.icon}</span>
                      {w.tt}
                    </p>
                    <p className="mt-1.5 max-w-[440px] text-[13.5px] leading-relaxed text-dim">{w.d}</p>
                  </div>
                  <span className="hidden self-center font-display text-[15px] font-bold text-gold opacity-0 transition-opacity group-hover:opacity-100 sm:block">Ⓐ</span>
                </div>
              ))}
            </div>
            <button onClick={onStart} className="btn-brand mt-8 flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14.5px] font-extrabold">
              <TokenIcon className="h-4 w-4" />
              {t("land.earnCta")}
            </button>
          </div>
        </div>
      </section>

      {/* privacy deal */}
      <section id="privacy" className="border-t border-line bg-panel/40">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-20 sm:px-6 lg:py-28">
          <div className="rv mx-auto max-w-[640px] text-center">
            <p className="overline mb-4 text-mint">{t("land.privKicker")}</p>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-tight tracking-tight">{t("land.privTitle")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-dim">{t("land.privBody")}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-[880px] gap-4 md:grid-cols-2">
            <div className="rv rounded-3xl border border-line bg-panel p-6">
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gold">
                {t("land.privBadge1")}
              </span>
              <p className="mt-4 text-[14px] leading-relaxed text-dim">{t("land.privPoint1")}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-dim">{t("land.privPoint2")}</p>
            </div>
            <div className="rv rounded-3xl border border-mint/35 bg-mint/6 p-6" style={{ transitionDelay: "100ms" }}>
              <span className="rounded-full border border-mint/45 bg-mint/12 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mint">
                {t("land.privBadge2")}
              </span>
              <p className="mt-4 flex items-start gap-2.5 text-[14px] leading-relaxed text-dim">
                <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-mint" /> {t("land.privPoint3")}
              </p>
              <p className="mt-3 flex items-start gap-2.5 text-[14px] leading-relaxed text-dim">
                <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-mint" /> {t("land.privPoint4")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-[1180px] px-4 py-20 sm:px-6 lg:py-28">
        <h2 className="rv mb-10 text-center font-display text-[clamp(26px,3.6vw,40px)] font-bold tracking-tight">{t("land.faqTitle")}</h2>
        <Faq />
      </section>

      {/* final CTA */}
      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:py-24">
          <BrandMark className="rv floaty h-12 w-12" />
          <h2 className="rv font-display text-[clamp(28px,4.2vw,48px)] font-bold leading-tight tracking-tight">{t("land.ctaTitle")}</h2>
          <p className="rv max-w-[460px] text-[15px] text-dim">{t("land.ctaBody")}</p>
          <div className="rv flex flex-wrap justify-center gap-3">
            <button onClick={onStart} className="btn-brand rounded-2xl px-7 py-3.5 text-[14.5px] font-extrabold">{t("land.ctaStart")}</button>
            <button onClick={onRestore} className="row-hl rounded-2xl border border-line px-6 py-3.5 text-[14px] font-bold text-dim hover:border-line2 hover:text-text">
              {t("land.ctaRestore")}
            </button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-3 px-4 py-6 sm:px-6">
          <BrandMark className="h-6 w-6" />
          <span className="font-mono text-[11px] text-faint">{t("land.footerRights")}</span>
          <span className="ms-auto font-mono text-[10.5px] text-faint">
            {t("land.footerMadeA")} <span className="text-violet3">&gt;_</span> {t("land.footerMadeB")}
          </span>
        </div>
      </footer>
    </div>
  );
}
