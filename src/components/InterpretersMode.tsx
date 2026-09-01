import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { credit, debit, fmtAide, type Wallet } from "../lib/wallet";
import { LANGS, langName } from "../lib/languages";
import { MicIcon, SpeakerIcon, CheckIcon, XIcon, BoltIcon, KeyIcon } from "./Icons";

export interface Interpreter {
  id: string;
  name: string;
  pairs: [string, string][];
  rate: number; // AIDE / minute
  rating: number;
  jobs: number;
  online: boolean;
  dialects: string;
}

const SEED: Interpreter[] = [
  { id: "i1", name: "Oksana M.", pairs: [["uk", "en"], ["uk", "pl"]], rate: 6, rating: 4.9, jobs: 312, online: true, dialects: "Hutsul, Surzhyk, business" },
  { id: "i2", name: "Yuki T.", pairs: [["ja", "en"], ["ja", "zh"]], rate: 8, rating: 4.8, jobs: 190, online: true, dialects: "Kansai, keigo (honorifics)" },
  { id: "i3", name: "Layla H.", pairs: [["ar", "en"], ["ar", "fr"]], rate: 7, rating: 5.0, jobs: 264, online: true, dialects: "Levantine, Gulf, MSA" },
  { id: "i4", name: "Chen W.", pairs: [["zh", "en"], ["yue", "en"]], rate: 7, rating: 4.7, jobs: 421, online: false, dialects: "Cantonese, Hokkien" },
  { id: "i5", name: "Amara O.", pairs: [["sw", "en"], ["yo", "en"]], rate: 5, rating: 4.9, jobs: 98, online: true, dialects: "Coastal Swahili, Yoruba proverbs" },
  { id: "i6", name: "Mateo R.", pairs: [["es", "en"], ["es", "pt"]], rate: 5, rating: 4.6, jobs: 540, online: true, dialects: "Rioplatense, Lunfardo slang" },
];

interface Props {
  wallet: Wallet;
  setWallet: (w: Wallet) => void;
  did: string;
}

export default function InterpretersMode({ wallet, setWallet, did }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"market" | "session" | "earn">("market");
  const [active, setActive] = useState<Interpreter | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<{ who: "a" | "b"; orig: string; tr: string }[]>([]);
  const timerRef = useRef<number | null>(null);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [lastSurvey, setLastSurvey] = useState<{ id: string; note: string } | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  function startSession(it: Interpreter) {
    setActive(it);
    setElapsed(0);
    setTranscript([]);
    setTab("session");
    let e = 0;
    const lines = sampleDialogue(it.pairs[0]);
    timerRef.current = window.setInterval(() => {
      e += 1;
      setElapsed(e);
      const idx = Math.min(lines.length - 1, Math.floor(e / 3));
      setTranscript(lines.slice(0, idx + 1));
      if (e >= lines.length * 3 + 2 && timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  }

  function endSession() {
    if (!active) return;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const minutes = Math.max(1, Math.round(elapsed / 6) / 10);
    const cost = Math.max(1, Math.round(minutes * active.rate));
    const after = debit(wallet, cost, `live session · ${active.name}`);
    if (after) setWallet(after);
    setLastSurvey({ id: active.id, note: active.name });
    setSurveyOpen(true);
    setTab("market");
    setActive(null);
    setElapsed(0);
    setTranscript([]);
  }

  const insufficient = active ? wallet.balance < active.rate : false;

  return (
    <div className="mx-auto flex h-full w-full max-w-[980px] flex-col px-4 py-5">
      {/* header + wallet */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight">{t("live.title")}</h1>
          <p className="text-[13px] text-dim">{t("live.sub")}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[12px] font-bold text-gold">
            <BoltIcon className="h-3.5 w-3.5" />
            {fmtAide(wallet.balance)}
          </span>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-full border border-line bg-panel p-1 self-start">
        {(
          [
            { id: "market", label: t("live.tabMarket") },
            { id: "session", label: t("live.tabSession") },
            { id: "earn", label: t("live.tabEarn") },
          ] as const
        ).map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition-all ${
              tab === tb.id ? "bg-panel3 text-text" : "text-faint hover:text-dim"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {tab === "market" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SEED.map((it) => (
              <div key={it.id} className="corners group relative rounded-2xl border border-line bg-panel p-4 transition-all hover:border-line2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet/15 font-display text-[15px] font-bold text-violet2">
                    {it.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-extrabold">
                      {it.name}
                      <span className={`h-1.5 w-1.5 rounded-full ${it.online ? "pulse-live bg-mint" : "bg-faint"}`} />
                    </p>
                    <p className="truncate font-mono text-[11px] text-faint">
                      {it.pairs.map(([a, b]) => `${langName(a)}⇄${langName(b)}`).join(" · ")}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-mono text-[13px] font-bold text-gold">{fmtAide(it.rate)}<span className="text-[10px] text-faint">/min</span></p>
                    <p className="text-[11px] text-dim">★ {it.rating} · {it.jobs} {t("live.jobs")}</p>
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-dim">
                  <span className="font-bold text-text">{t("live.dialects")}:</span> {it.dialects}
                </p>
                <button
                  onClick={() => startSession(it)}
                  disabled={!it.online}
                  className="btn-brand mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-extrabold disabled:opacity-35 disabled:saturate-50"
                >
                  <MicIcon className="h-4 w-4" />
                  {it.online ? t("live.start") : t("live.offline")}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "session" && (
          active ? (
            <div className="flex h-full flex-col rounded-2xl border border-line bg-panel">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/15 font-display font-bold text-violet2">{active.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold">{active.name}</p>
                  <p className="font-mono text-[11px] text-mint">● {t("live.recording")} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</p>
                </div>
                {insufficient && <span className="font-mono text-[10px] text-coral">{t("live.lowBalance")}</span>}
                <button onClick={endSession} className="flex items-center gap-1.5 rounded-xl bg-coral px-3.5 py-2 text-[12.5px] font-extrabold text-white transition-all hover:brightness-110">
                  <XIcon className="h-3.5 w-3.5" /> {t("live.end")}
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {transcript.length === 0 && <p className="font-mono text-[12px] text-faint">{t("live.waiting")}</p>}
                {transcript.map((l, i) => (
                  <div key={i} className={`anim-rise flex gap-2.5 ${l.who === "a" ? "" : "flex-row-reverse"}`}>
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${l.who === "a" ? "bg-cyanic/15 text-cyanic" : "bg-gold/15 text-gold"}`}>
                      {l.who === "a" ? "A" : "B"}
                    </span>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${l.who === "a" ? "bg-panel3" : "bg-violet/12"}`}>
                      <p className="text-[13.5px] font-semibold leading-relaxed">{l.orig}</p>
                      <p className="mt-1 border-t border-line/60 pt-1 text-[12.5px] leading-relaxed text-dim">↳ {l.tr}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line px-4 py-3 font-mono text-[11px] text-faint">
                {t("live.sessionCost")}: ~{fmtAide(Math.max(1, Math.round((Math.max(1, elapsed / 6) / 10) * active.rate)))} · {t("live.escrow")}
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center">
              <p className="font-mono text-[12px] text-faint">{t("live.noSession")}</p>
            </div>
          )
        )}

        {tab === "earn" && <EarnPanel wallet={wallet} setWallet={setWallet} did={did} />}
      </div>

      {surveyOpen && lastSurvey && (
        <SurveyModal note={lastSurvey.note} onClose={() => setSurveyOpen(false)} />
      )}
    </div>
  );
}

function sampleDialogue(pair: [string, string]): { who: "a" | "b"; orig: string; tr: string }[] {
  const [a, b] = pair;
  void a;
  void b;
  return [
    { who: "a", orig: "Вітаю! Чи встигаємо ми на зустріч о третій?", tr: "Hello! Are we still on for the 3 o'clock meeting?" },
    { who: "b", orig: "Yes — I'll meet you at the main entrance.", tr: "Так — зустрінемося біля головного входу." },
    { who: "a", orig: "Чудово. До речі, як пройшла ваша подорож?", tr: "Great. By the way, how was your trip?" },
    { who: "b", orig: "Long, but the layover in Warsaw was pleasant.", tr: "Довга, але пересадка у Варшаві була приємною." },
    { who: "a", orig: "Розумію. Тоді до зустрічі о третій!", tr: "I see. Then see you at three!" },
  ];
}

function EarnPanel({ wallet, setWallet, did }: { wallet: Wallet; setWallet: (w: Wallet) => void; did: string }) {
  const { t } = useI18n();
  const [lang1, setLang1] = useState("uk");
  const [lang2, setLang2] = useState("en");
  const [rate, setRate] = useState(5);
  const [joined, setJoined] = useState(false);

  function join() {
    const after = credit(wallet, 10, "linguist onboarding bonus", "grant");
    setWallet(after);
    setJoined(true);
  }

  return (
    <div className="mx-auto max-w-[560px] rounded-2xl border border-line bg-panel p-5">
      <h2 className="font-display text-[18px] font-bold">{t("earn.title")}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-dim">{t("earn.sub")}</p>

      {!joined ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{t("earn.native")}</span>
              <select value={lang1} onChange={(e) => setLang1(e.target.value)} className="field">
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.native}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{t("earn.working")}</span>
              <select value={lang2} onChange={(e) => setLang2(e.target.value)} className="field">
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.native}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{t("earn.rate")} — {fmtAide(rate)}/min</span>
            <input type="range" min={1} max={20} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </label>
          <p className="rounded-xl border border-line bg-panel2 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-faint">
            {t("earn.payout")} · {t("earn.kyc")}
          </p>
          <button onClick={join} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-extrabold">
            <KeyIcon className="h-4 w-4" />
            {t("earn.join")}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-mint/40 bg-mint/8 px-3.5 py-3 text-[13px] font-bold text-mint">
            <CheckIcon className="h-4 w-4" />
            {t("earn.joined")} <span className="font-mono text-[11px] font-normal text-dim">({did.slice(0, 24)}…)</span>
          </div>
          <div className="rounded-xl border border-line bg-panel2 px-3.5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-faint">{t("earn.yourPair")}</p>
            <p className="mt-1 text-[14px] font-extrabold">{langName(lang1)} ⇄ {langName(lang2)} · {fmtAide(rate)}/min</p>
          </div>
          <p className="text-[12px] leading-relaxed text-dim">{t("earn.next")}</p>
        </div>
      )}
    </div>
  );
}

function SurveyModal({ note, onClose }: { note: string; onClose: () => void }) {
  const { t } = useI18n();
  const [slang, setSlang] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative w-full max-w-[420px] rounded-2xl border border-line2 bg-panel p-5 shadow-2xl">
        <h3 className="font-display text-[16px] font-bold">{t("survey.title")}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{t("survey.sub")} <b className="text-text">{note}</b></p>
        {!done ? (
          <>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{t("survey.slang")}</span>
              <textarea value={slang} onChange={(e) => setSlang(e.target.value)} rows={3} className="field resize-none" placeholder={t("survey.ph")} />
            </label>
            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="row-hl flex-1 rounded-xl border border-line py-2.5 text-[13px] font-bold text-dim hover:text-text">{t("common.skip")}</button>
              <button onClick={() => setDone(true)} className="btn-brand flex-1 rounded-xl py-2.5 text-[13px] font-extrabold">{t("survey.submit")}</button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-mint/40 bg-mint/8 px-3.5 py-3 text-[13px] font-bold text-mint">
              <CheckIcon className="h-4 w-4" /> {t("survey.thanks")}
            </p>
            <button onClick={onClose} className="btn-brand mt-3 w-full rounded-xl py-2.5 text-[13px] font-extrabold">{t("common.close")}</button>
          </>
        )}
      </div>
    </div>
  );
}
