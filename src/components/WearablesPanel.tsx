import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { hasWebBluetooth, listNearby, type WearableDevice } from "../lib/wearables";
import { XIcon, CheckIcon, GlobeIcon, MicIcon, BoltIcon } from "./Icons";

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
    const id = window.setInterval(() => {
      setCaption(lines[i % lines.length]);
      i++;
    }, 2600);
    return () => window.clearInterval(id);
  }, [connected, t]);

  function connect(d: WearableDevice) {
    setBusyId(d.id);
    window.setTimeout(() => {
      setConnected(d);
      setBusyId(null);
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <GlobeIcon className="h-4.5 w-4.5 text-violet2" />
          <div>
            <h2 className="font-display text-[15px] font-bold">{t("wear.title")}</h2>
            <p className="font-mono text-[10.5px] text-faint">
              {hasWebBluetooth() ? t("wear.btReady") : t("wear.btNone")}
            </p>
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
            <div className="mt-4 rounded-2xl border border-mint/40 bg-mint/6 p-4">
              <div className="flex items-center gap-2.5">
                <MicIcon className="h-4 w-4 text-mint" />
                <p className="text-[13.5px] font-extrabold">{connected.name}</p>
                <span className="ms-auto font-mono text-[11px] text-mint">● {t("wear.live")}</span>
              </div>
              <p className="mt-2 min-h-[38px] rounded-xl bg-ink px-3 py-2 font-mono text-[12px] leading-relaxed text-brand">
                {caption || t("wear.listening")}
                <span className="caret ms-1" />
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-faint">🔋 {connected.battery}% · {KIND_LABEL[connected.kind]}</span>
                <button onClick={() => { setConnected(null); setCaption(""); }} className="font-mono text-[11px] font-bold text-coral hover:underline">
                  {t("wear.disconnect")}
                </button>
              </div>
            </div>
          )}

          <p className="mt-5 mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{t("wear.nearby")}</p>
          <div className="space-y-2">
            {listNearby().map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel2 px-3.5 py-2.5 transition-colors hover:border-line2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/12 text-violet2">
                  <MicIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{d.name}</p>
                  <p className="font-mono text-[10.5px] text-faint">{KIND_LABEL[d.kind]} · 🔋 {d.battery}%</p>
                </div>
                {busyId === d.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-line2 border-t-brand" />
                ) : connected?.id === d.id ? (
                  <CheckIcon className="h-4 w-4 text-mint" />
                ) : (
                  <button onClick={() => connect(d)} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-dim transition-all hover:border-brand/50 hover:text-brand">
                    <BoltIcon className="h-3 w-3" /> {t("wear.pair")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
