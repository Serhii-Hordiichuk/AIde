import { useEffect, useRef, useState } from "react";
import {
  createIdentity, importIdentity, identityBackup, shortDid,
  type Identity,
} from "../lib/did";
import { BrandMark, Wordmark, CheckIcon, CopyIcon, KeyIcon, BoltIcon } from "./Icons";

type Phase = "idle" | "generating" | "ready" | "import";

const GEN_STEPS = [
  "collecting entropy from WebCrypto…",
  "generating ECDSA P-256 keypair…",
  "deriving did:key (multicodec p256-pub)…",
  "identity sealed — keys never leave this device",
];

export default function AuthGate({
  onReady,
  initial = "idle",
  onBack,
}: {
  onReady: (id: Identity) => void;
  initial?: "idle" | "import";
  onBack?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(initial);
  const [log, setLog] = useState<string[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"did" | "key" | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  async function create() {
    setError("");
    setPhase("generating");
    setLog([]);
    for (let i = 0; i < GEN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, i === 1 ? 700 : 420));
      setLog((l) => [...l, GEN_STEPS[i]]);
    }
    const id = await createIdentity();
    await new Promise((r) => setTimeout(r, 350));
    setIdentity(id);
    setPhase("ready");
  }

  async function restore() {
    setError("");
    try {
      const id = await importIdentity(importText);
      onReady(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  }

  function download(id: Identity) {
    const blob = new Blob([identityBackup(id)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aide-identity.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy(text: string, what: "did" | "key") {
    await navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 1300);
  }

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-y-auto bg-bg px-4">
      {/* ambient */}
      <div className="ambient" aria-hidden>
        <div className="dots" />
        <div className="tint tint-mint" />
        <div className="tint tint-gold" />
      </div>

      <div className="anim-rise relative w-full max-w-[520px] py-8">
        {onBack && phase !== "generating" && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-faint transition-colors hover:text-text"
          >
            ← back to aide
          </button>
        )}
        {/* brand */}
        <div className="mb-6 flex items-center gap-3">
          <span className="floaty">
            <BrandMark className="h-11 w-11 drop-shadow-[0_0_24px_#615ced66]" />
          </span>
          <div>
            <Wordmark className="text-[22px] leading-none" />
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-faint">
              self-sovereign ai studio
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line2 bg-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          {/* console header */}
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
            {["#ff6b6b", "#ffc24b", "#3ecf8e"].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.75 }} />
            ))}
            <span className="ml-2 font-mono text-[11px] text-faint">aide — identity console</span>
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wider text-violet3">did:key · p-256</span>
          </div>

          <div className="p-5">
            {phase === "idle" && (
              <div>
                <p className="text-[14px] leading-relaxed text-dim">
                  AiDe has no accounts, no emails, no servers holding your data. Access is granted to a{" "}
                  <b className="text-text">decentralized identity (DID)</b> that is generated and stored only on
                  this device — registration gives you full access to chat, coder and provider keys.
                </p>
                <button onClick={create} className="btn-brand mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-extrabold">
                  <BoltIcon className="h-4 w-4" />
                  Create DID identity
                </button>
                <button
                  onClick={() => {
                    setPhase("import");
                    setError("");
                  }}
                  className="row-hl mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] font-bold text-dim hover:text-text"
                >
                  <KeyIcon className="h-4 w-4" />
                  Restore from backup
                </button>
              </div>
            )}

            {phase === "import" && (
              <div>
                <p className="text-[13px] text-dim">
                  Paste the contents of your <span className="font-mono text-[12px] text-violet3">aide-identity.json</span>{" "}
                  backup — the DID is re-derived and the key is verified locally.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={6}
                  placeholder='{ "app": "aide", "did": "did:key:z…", "priv": { … } }'
                  className="field field-mono mt-3 w-full resize-y text-[11.5px]"
                />
                {error && <p className="mt-2 text-[12.5px] font-semibold text-coral">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (onBack) onBack();
                      else setPhase("idle");
                      setError("");
                    }}
                    className="row-hl flex-1 rounded-xl border border-line py-2.5 text-[13px] font-bold text-dim hover:text-text"
                  >
                    Back
                  </button>
                  <button
                    onClick={restore}
                    disabled={!importText.trim()}
                    className="btn-brand flex-1 rounded-xl py-2.5 text-[13px] font-extrabold disabled:opacity-35 disabled:saturate-50"
                  >
                    Verify &amp; enter
                  </button>
                </div>
              </div>
            )}

            {phase === "generating" && (
              <div ref={logRef} className="min-h-[150px] font-mono text-[12px] leading-relaxed">
                {log.map((l, i) => (
                  <p key={i} className="term-line text-dim">
                    <span className="text-violet3">$</span> {l}
                  </p>
                ))}
                {log.length < GEN_STEPS.length && <span className="caret" />}
              </div>
            )}

            {phase === "ready" && identity && (
              <div>
                <p className="flex items-center gap-2 text-[13px] font-bold text-mint">
                  <CheckIcon className="h-4 w-4" /> Identity created — full access unlocked
                </p>
                <div className="mt-3 rounded-xl border border-line bg-ink px-3.5 py-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">your DID</p>
                  <p className="mt-1 break-all font-mono text-[12.5px] leading-relaxed text-violet3">{identity.did}</p>
                </div>

                <div className="mt-3 rounded-xl border border-gold/35 bg-gold/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-gold">
                  <b>Back up your key now.</b> It is the only way to restore this identity — AiDe cannot recover it.
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copy(identity.did, "did")}
                    className="row-hl flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[12.5px] font-bold text-dim hover:text-text"
                  >
                    {copied === "did" ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
                    {copied === "did" ? "Copied" : "Copy DID"}
                  </button>
                  <button
                    onClick={() => download(identity)}
                    className="row-hl flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[12.5px] font-bold text-dim hover:text-text"
                  >
                    <KeyIcon className="h-3.5 w-3.5" /> Download key
                  </button>
                </div>

                <button onClick={() => onReady(identity)} className="btn-brand mt-2 w-full rounded-xl py-3 text-[14px] font-extrabold">
                  Enter AiDe →
                </button>
              </div>
            )}
          </div>
        </div>

        {phase === "ready" && identity && (
          <p className="mt-3 text-center font-mono text-[10px] text-faint">
            {shortDid(identity.did)} · ECDSA P-256 · stored in this browser only
          </p>
        )}
      </div>
    </div>
  );
}
