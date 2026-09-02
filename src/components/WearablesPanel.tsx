import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { DEMO_DEVICES, hasWebBluetooth, type WearableDevice } from "../lib/wearables";
import { XIcon, GlobeIcon, MicIcon, BoltIcon, CheckIcon } from "./Icons";

interface Props {
  onClose: () => void;
}

const KIND_LABEL: Record<WearableDevice["kind"], string> = {
  glasses: "smart glasses",
  earbuds: "earbuds",
  hud: "HUD",
  watch: "watch",
};

export default function WearablesPanel({ onClose }: Props) {
  const { t } = useI18n();
  const [connected, setConnected] = useState<WearableDevice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!connected) return;
    const lines = t("wear.demoCaptions").split("|");
    let i = 0;
    setCaption(lines[0]);
    const id = window.setInterval(() => {
      i = (i + 1) % lines.length;
      setCaption(lines[i]);
    }, 2600);
    return () => window.clearInterval(id);
  }, [connected, t]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function connect(d: WearableDevice) {
    setBusyId(d.id);
    window.setTimeout(() => {
      setConnected(d);
      setBusyId(null);
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <GlobeIcon className="h-4.5 w-4.5 text-violet2" />
          <div>
            <h2 className="font-display text-[15px] font-bold">{t("wear.title")}</h2>
            <p className="font-mono text-[10.5px] text-faint">{hasWebBluetooth() ? t("wear.btReady") : t("wear.btNone")}</p>
          </div>
          <button onClick={onClose} className="icon-btn ms-auto" title={t("common.close")} aria-label={t("common.close")}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-[12px] leading-relaxed text-dim">
            {t("wear.privacy")}
          </p>

          {connected && (
            <div className="corners relative mt-4 overflow-hidden rounded-2xl border border-violet/40 bg-ink p-4">
              <div className="flex items-center gap-2.5">
                <span className="mic-ripples relative flex h-9 w-9 items-center justify-center rounded-full border border-violet/50 text-violet2">
                  <span /><span />
                  <MicIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-extrabold">{connected.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-faint">{KIND_LABEL[connected.kind]}</p>
                </div>
                <span className="ms-auto flex items-center gap-1.5 font-mono text-[11px] text-mint">
                  <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> {t("wear.live")}
                </span>
              </div>
              <p className="mt-4 min-h-[44px] rounded-xl border border-line bg-panel px-3.5 py-3 text-[14.5px] font-semibold leading-relaxed">
                {caption || t("wear.listening")}
                <span className="caret ms-1.5" />
              </p>
              <button
                onClick={() => setConnected(null)}
                className="row-hl mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[12.5px] font-bold text-dim hover:text-coral"
              >
                <XIcon className="h-3.5 w-3.5" /> {t("wear.disconnect")}
              </button>
            </div>
          )}

          <p className="overline mb-2 mt-5">{t("wear.nearby")}</p>
          <ul className="space-y-2">
            {DEMO_DEVICES.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel2/60 px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyanic/12 text-cyanic">
                  <GlobeIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-extrabold">{d.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-faint">{KIND_LABEL[d.kind]}</p>
                </div>
                {connected?.id === d.id ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold text-mint">
                    <CheckIcon className="h-3.5 w-3.5" /> {t("wear.live")}
                  </span>
                ) : (
                  <button
                    onClick={() => connect(d)}
                    disabled={busyId === d.id}
                    className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12px] font-extrabold text-dim transition-all hover:border-cyanic/50 hover:text-cyanic disabled:opacity-50"
                  >
                    {busyId === d.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-line2 border-t-cyanic" />
                    ) : (
                      <BoltIcon className="h-3 w-3" />
                    )}
                    {t("wear.pair")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
