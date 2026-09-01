import { useEffect, useMemo, useRef, useState } from "react";
import { PROVIDERS } from "../data/providers";
import { BrandMark, Wordmark, ChatIcon, TranslateIcon, KeyIcon, CheckIcon, GlobeIcon, MicIcon, BoltIcon, Seal, Tryzub, SpeakerIcon } from "./Icons";
import { ThemeToggle, LangPicker } from "./Appearance";
import { useI18n } from "../lib/i18n";
import type { ThemeMode } from "../lib/theme";

/* =================================================================
   Landing — shown until a DID identity exists.
   Product story: AiDe = our AI chat + a linguist interpreter.
   ================================================================= */

interface Props {
  onStart: () => void;
  onRestore: () => void;
  theme: { mode: ThemeMode; setMode: (m: ThemeMode) => void };
}

export default function Landing({ onStart, onRestore, theme }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

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
            {lang === "zh" && <Seal ch="译" className="h-7 w-7 text-[13px]" />}
            {lang === "uk" && <Tryzub className="h-7 w-7" />}
          </a>
          <nav className="ms-6 hidden items-center gap-6 text-[13px] font-bold text-dim md:flex">
            <a href="#studio" className="transition-colors hover:text-text">{t("land.navStudio")}</a>
            <a href="#linguist" className="transition-colors hover:text-text">{t("land.navLing")}</a>
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

      {/* ---------- hero: chat terminal + linguist pulse ---------- */}
      <section id="top" className="relative mx-auto grid max-w-[1120px] items-center gap-10 px-4 pb-14 pt-10 sm:px-5 lg:grid-cols-[1.05fr_1fr] lg:pb-16 lg:pt-20">
        <div>
          <p className="mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet3">
            <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.kicker")}
            {lang === "zh" && <Seal ch="智" className="ms-1 h-7 w-7 text-[13px]" />}
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

        <HeroTerminal />
      </section>

      {/* ---------- ticker ---------- */}
      <div className="relative border-y border-line bg-panel/60 py-3" aria-hidden>
        <div className="ticker">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="mx-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              <span className="h-1 w-1 rounded-full bg-violet2/70" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- the studio: two modes ---------- */}
      <section id="studio" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-5 lg:py-24">
        <div className="reveal max-w-[640px]">
          <p className="overline mb-3">{t("land.studioOverline")}</p>
          <h2 className="font-display text-[clamp(24px,3.6vw,40px)] font-bold leading-tight tracking-tight">
            {t("land.studioTitle1")} <span className="text-violet2">{t("land.studioTitle2")}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-dim">{t("land.studioSub")}</p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* chat — wide card with live chips */}
          <a href="#top" onClick={(e) => { e.preventDefault(); onStart(); }} className="reveal group relative overflow-hidden rounded-3xl border border-line bg-panel p-6 transition-all hover:-translate-y-1 hover:border-violet/45 sm:p-8">
            <span className="corners" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/15 text-violet2">
                <ChatIcon className="h-5 w-5" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">01 · {t("mode.chat")}</span>
            </div>
            <h3 className="mt-5 text-[20px] font-extrabold sm:text-[22px]">{t("land.chatTitle")}</h3>
            <p className="mt-2.5 max-w-[460px] text-[14px] leading-relaxed text-dim">{t("land.chatBody")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["land.tag.stream", "land.tag.think", "land.tag.search", "land.tag.deep", "land.tag.voice"].map((k) => (
                <span key={k} className="rounded-full border border-line2 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-dim transition-colors group-hover:border-violet/40 group-hover:text-violet3">
                  {t(k)}
                </span>
              ))}
            </div>
            <ChatIcon className="pointer-events-none absolute -bottom-6 -end-6 h-40 w-40 text-violet/10 transition-transform duration-500 group-hover:scale-110" />
          </a>

          {/* linguist — tall accent card */}
          <a href="#linguist" className="reveal group relative overflow-hidden rounded-3xl border border-violet/35 bg-gradient-to-b from-violet/12 to-transparent p-6 transition-all hover:-translate-y-1 hover:border-violet/60 sm:p-8" style={{ transitionDelay: "90ms" }}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyanic/15 text-cyanic">
                <TranslateIcon className="h-5 w-5" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">02 · {t("tr.title")}</span>
            </div>
            <h3 className="mt-5 text-[20px] font-extrabold sm:text-[22px]">{t("land.lingCardTitle")}</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-dim">{t("land.lingCardBody")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["land.lingTagPtt", "land.lingTagAd", "land.lingTagVoice", "land.lingTagDoc"].map((k) => (
                <span key={k} className="rounded-full border border-line2 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-dim transition-colors group-hover:border-cyanic/45 group-hover:text-cyanic">
                  {t(k)}
                </span>
              ))}
            </div>
            <span className="pointer-events-none absolute -bottom-4 -end-4 flex items-end gap-1 opacity-25 transition-opacity group-hover:opacity-60">
              {[10, 18, 26, 18, 10].map((h, i) => (
                <span key={i} className="w-1.5 rounded-full bg-cyanic" style={{ height: h, animation: `eqBar 1.1s ease-in-out ${i * 0.12}s infinite` }} />
              ))}
            </span>
          </a>
        </div>

        {/* stats strip */}
        <div className="reveal mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {[
            { n: t("land.stat1n"), l: t("land.stat1l") },
            { n: t("land.stat2n"), l: t("land.stat2l") },
            { n: t("land.stat3n"), l: t("land.stat3l") },
            { n: t("land.stat4n"), l: t("land.stat4l") },
          ].map((s, i) => (
            <div key={i} className="bg-panel px-5 py-5 transition-colors hover:bg-panel2">
              <p className="font-display text-[22px] font-bold text-violet2 sm:text-[26px]">{s.n}</p>
              <p className="mt-1 text-[12px] leading-snug text-dim">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- linguist spotlight ---------- */}
      <section id="linguist" className="relative border-y border-line bg-panel/50 py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="reveal">
            <p className="overline mb-3">{t("land.lingKicker")}</p>
            <h2 className="font-display text-[clamp(24px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              {t("land.lingTitle1")} <span className="text-cyanic">{t("land.lingTitle2")}</span>
            </h2>
            <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-dim">{t("land.lingBody")}</p>

            <ul className="mt-7 space-y-3.5">
              {[
                { icon: MicIcon, txt: t("land.lingFeat1") },
                { icon: GlobeIcon, txt: t("land.lingFeat2") },
                { icon: SpeakerIcon, txt: t("land.lingFeat3") },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyanic/12 text-cyanic">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[14px] leading-relaxed text-dim">{f.txt}</span>
                </li>
              ))}
            </ul>

            <button onClick={onStart} className="btn-brand mt-8 flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-extrabold">
              <TranslateIcon className="h-4 w-4" />
              {t("land.lingCta")}
            </button>
          </div>

          <InterpreterDemo />
        </div>
      </section>

      {/* ---------- privacy / DID ---------- */}
      <section id="privacy" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-5 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="reveal">
            <p className="overline mb-3">{t("land.privOverline")}</p>
            <h2 className="font-display text-[clamp(24px,3.6vw,40px)] font-bold leading-tight tracking-tight">
              {t("land.privTitle1")} <span className="text-violet2">{t("land.privTitle2")}</span>
            </h2>
            <div className="mt-7 space-y-5">
              {[
                { t: t("land.priv1t"), d: t("land.priv1d") },
                { t: t("land.priv2t"), d: t("land.priv2d") },
                { t: t("land.priv3t"), d: t("land.priv3d") },
                { t: t("land.priv4t"), d: t("land.priv4d") },
              ].map((b, i) => (
                <div key={i} className="reveal flex gap-3.5" style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet/15 font-mono text-[11px] font-bold text-violet3">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-extrabold">{b.t}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-dim">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DidCard />
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-[820px] px-4 pb-16 sm:px-5 lg:pb-24">
        <div className="reveal text-center">
          <p className="overline mb-3">{t("land.faqOverline")}</p>
          <h2 className="font-display text-[clamp(22px,3.2vw,34px)] font-bold tracking-tight">{t("land.faqTitle")}</h2>
        </div>
        <div className="mt-8 space-y-2.5">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative border-t border-line bg-panel/50">
        <div className="mx-auto max-w-[760px] px-4 py-16 text-center sm:px-5 lg:py-24">
          <div className="reveal">
            <div className="floaty mx-auto mb-6 w-fit">
              <BrandMark className="h-14 w-14 drop-shadow-[0_0_28px_color-mix(in_srgb,var(--t-violet)_45%,transparent)]" />
            </div>
            <h2 className="font-display text-[clamp(26px,4.4vw,46px)] font-bold leading-tight tracking-tight">
              {t("land.finalA")} <span className="text-violet2">{t("land.finalB")}</span> {t("land.finalC")}
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[14.5px] leading-relaxed text-dim">{t("land.finalSub")}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={onStart} className="cta-sheen btn-brand rounded-2xl px-7 py-3.5 text-[15px] font-extrabold">
                {t("land.ctaCreate")}
              </button>
              <button onClick={onRestore} className="rounded-2xl border border-line2 px-6 py-3.5 text-[14px] font-bold text-dim transition-all hover:border-violet/50 hover:text-text">
                {t("land.ctaRestore")}
              </button>
            </div>
            <p className="mt-5 font-mono text-[10.5px] text-faint">{t("land.finalNote")}</p>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-4 py-6 sm:px-5">
          <BrandMark className="h-6 w-6" />
          <Wordmark className="text-[13px]" />
          <span className="font-mono text-[10.5px] text-faint">{t("land.footerRights")}</span>
          <span className="ms-auto font-mono text-[10.5px] text-faint">
            {t("land.footerMadeA")} <span className="text-violet3">&gt;_</span> {t("land.footerMadeB")}
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- hero terminal: the chat IS the product ---------- */

function HeroTerminal() {
  const { t } = useI18n();
  const SCENES = useMemo(
    () => [
      { prompt: t("land.scene1p"), reply: t("land.scene1r") },
      { prompt: t("land.scene2p"), reply: t("land.scene2r") },
      { prompt: t("land.scene3p"), reply: t("land.scene3r") },
    ],
    [t]
  );

  const [scene, setScene] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<"typing" | "stream" | "hold">("typing");
  const current = SCENES[scene];

  useEffect(() => {
    let timer: number;
    if (phase === "typing") {
      if (chars < current.prompt.length) {
        timer = window.setTimeout(() => setChars((c) => c + 2), 34);
      } else {
        timer = window.setTimeout(() => {
          setPhase("stream");
          setChars(0);
        }, 420);
      }
    } else if (phase === "stream") {
      if (chars < current.reply.length) {
        timer = window.setTimeout(() => setChars((c) => c + 4), 22);
      } else {
        setPhase("hold");
        timer = window.setTimeout(() => {
          setScene((s) => (s + 1) % SCENES.length);
          setChars(0);
          setPhase("typing");
        }, 2600);
      }
    }
    return () => window.clearTimeout(timer);
  }, [phase, chars, current, SCENES.length]);

  return (
    <div className="reveal anim-rise relative" style={{ transitionDelay: "150ms" }}>
      <div className="absolute -inset-6 rounded-[32px] bg-violet/8 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_80px_-24px_var(--t-shadow)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.8 }} />
          ))}
          <span className="ms-2 font-mono text-[11px] text-faint">aide · chat</span>
          <span className="ms-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mint">
            <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.termLive")}
          </span>
        </div>

        <div className="min-h-[280px] space-y-4 px-5 py-5 font-mono text-[12.5px] leading-relaxed">
          <p className="text-dim">
            <span className="text-violet3">$</span> {current.prompt.slice(0, chars)}
            {phase === "typing" && <span className="caret" />}
          </p>
          {phase !== "typing" && (
            <div className="rounded-xl border border-line bg-panel2/70 px-4 py-3 text-text/90">
              <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
                <BrandMark className="h-3.5 w-3.5" /> aide · {t("land.termRouted")}
              </p>
              <p className="whitespace-pre-wrap">
                {current.reply.slice(0, chars)}
                {phase === "stream" && <span className="caret" />}
              </p>
            </div>
          )}
          {phase === "hold" && (
            <p className="anim-rise flex items-center gap-2 font-mono text-[10.5px] text-mint">
              <CheckIcon className="h-3.5 w-3.5" /> {t("land.termBilled")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- interpreter demo: scripted two-sided conversation ---------- */

function InterpreterDemo() {
  const { t } = useI18n();
  const script = useMemo(
    () => [
      { side: "a" as const, orig: t("land.demoA1"), trans: t("land.demoA1t") },
      { side: "b" as const, orig: t("land.demoB1"), trans: t("land.demoB1t") },
      { side: "a" as const, orig: t("land.demoA2"), trans: t("land.demoA2t") },
      { side: "b" as const, orig: t("land.demoB2"), trans: t("land.demoB2t") },
    ],
    [t]
  );
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setSpeaking(true);
      const t1 = window.setTimeout(() => {
        setSpeaking(false);
        setStep((s) => (s + 1) % (script.length + 1));
      }, 1500);
      return t1;
    };
    let timer = window.setTimeout(cycle, 600);
    const iv = window.setInterval(() => {
      timer = window.setTimeout(cycle, 0);
    }, 2600);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(iv);
    };
  }, [script.length]);

  const shown = script.slice(0, Math.min(step, script.length));
  const active = step < script.length ? script[step] : null;

  const Phone = ({ side }: { side: "a" | "b" }) => {
    const isActive = active?.side === side && speaking;
    const accent = side === "a" ? "var(--t-violet2)" : "var(--t-gold)";
    return (
      <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-5 transition-all" style={isActive ? { borderColor: accent, boxShadow: `0 0 34px -6px ${accent}66` } : undefined}>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          {side === "a" ? t("land.demoSideA") : t("land.demoSideB")}
        </span>
        <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${isActive ? "mic-active" : ""}`} style={{ borderColor: accent, color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)` }}>
          {isActive && (
            <>
              <span className="mic-ring" style={{ borderColor: accent }} />
              <span className="mic-ring" style={{ borderColor: accent, animationDelay: "0.45s" }} />
            </>
          )}
          <MicIcon className="h-6 w-6" />
        </div>
        <p className="min-h-[36px] text-center text-[12.5px] leading-snug text-dim">
          {isActive ? active.orig : shown.filter((s) => s.side === side).slice(-1)[0]?.orig ?? "…"}
        </p>
      </div>
    );
  };

  return (
    <div className="reveal relative" style={{ transitionDelay: "120ms" }}>
      <div className="absolute -inset-6 rounded-[32px] bg-cyanic/6 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_80px_-24px_var(--t-shadow)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.8 }} />
          ))}
          <span className="ms-2 font-mono text-[11px] text-faint">{t("land.lingDemoTitle")}</span>
          <span className="ms-auto font-mono text-[10px] uppercase tracking-wider text-cyanic">{t("land.lingDemoSub")}</span>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-stretch gap-3">
            <Phone side="a" />
            <div className="flex flex-col items-center justify-center gap-1 text-faint">
              <TranslateIcon className="h-5 w-5 text-cyanic" />
              <span className="font-mono text-[9px] uppercase tracking-wider">{t("land.demoArrow")}</span>
            </div>
            <Phone side="b" />
          </div>

          {/* transcript */}
          <div className="mt-4 min-h-[128px] space-y-2 rounded-xl border border-line bg-panel2/60 px-4 py-3">
            {shown.length === 0 && <p className="font-mono text-[11px] text-faint">{t("land.demoWaiting")}</p>}
            {shown.map((s, i) => (
              <div key={`${i}-${s.orig}`} className="anim-rise flex items-start gap-2 text-[12.5px] leading-relaxed">
                <span className={`mt-0.5 rounded px-1.5 py-px font-mono text-[9.5px] font-bold uppercase ${s.side === "a" ? "bg-violet/15 text-violet3" : "bg-gold/15 text-gold"}`}>
                  {s.side === "a" ? "A" : "B"}
                </span>
                <p className="min-w-0">
                  <span className="text-text">{s.orig}</span>
                  <span className="text-faint"> · </span>
                  <span className="text-cyanic">{s.trans}</span>
                </p>
              </div>
            ))}
            {active && speaking && (
              <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
                {t("land.demoListen")}
              </p>
            )}
          </div>

          <p className="mt-3 flex items-center gap-2 font-mono text-[10.5px] text-faint">
            <span className="pulse-live h-1.5 w-1.5 rounded-full bg-cyanic" />
            {t("land.demoLoop")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- DID identity card ---------- */

function DidCard() {
  const { t } = useI18n();
  return (
    <div className="reveal relative" style={{ transitionDelay: "140ms" }}>
      <div className="absolute -inset-6 rounded-[32px] bg-gold/6 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-line2 bg-panel p-6 shadow-[0_30px_80px_-24px_var(--t-shadow)]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t("land.cardTitle")}</p>
          <span className="flex items-center gap-1.5 rounded-full border border-mint/40 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-mint">
            <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" />
            {t("land.cardActive")}
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-ink px-4 py-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">did:key</p>
          <p className="mt-1.5 break-all font-mono text-[12.5px] leading-relaxed text-violet3">
            did:key:z6MkqRYp4…W3xDh8fT
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[11px]">
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.16em] text-faint">{t("land.cardCurve")}</dt>
            <dd className="mt-0.5 text-text">ECDSA P-256</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.16em] text-faint">{t("land.cardProof")}</dt>
            <dd className="mt-0.5 text-mint">{t("land.cardProofV")}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.16em] text-faint">{t("land.cardStorage")}</dt>
            <dd className="mt-0.5 text-text">{t("land.cardStorageV")}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.16em] text-faint">{t("land.cardSub")}</dt>
            <dd className="mt-0.5 text-text">WebCrypto</dd>
          </div>
        </dl>

        <p className="mt-5 border-t border-line pt-4 font-mono text-[10.5px] leading-relaxed text-faint">
          {t("land.cardNote")}
        </p>
      </div>
    </div>
  );
}

/* ---------- FAQ item ---------- */

function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="reveal overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line2" style={{ transitionDelay: `${delay}ms` }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-start" aria-expanded={open}>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line2 font-mono text-[11px] transition-all ${open ? "border-violet/50 bg-violet/15 text-violet3" : "text-faint"}`}>
          {open ? "−" : "+"}
        </span>
        <span className="flex-1 text-[14.5px] font-extrabold">{q}</span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 ps-14 text-[13.5px] leading-relaxed text-dim">{a}</p>
        </div>
      </div>
    </div>
  );
}
