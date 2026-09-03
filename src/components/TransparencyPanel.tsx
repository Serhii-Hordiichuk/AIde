import { useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { XIcon, CheckIcon, KeyIcon, TokenIcon } from "./Icons";

interface Props {
  onClose: () => void;
}

export default function TransparencyPanel({ onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4.5 w-4.5 text-mint" />
          <div>
            <h2 className="font-display text-[15px] font-bold">{t("privacy.title")}</h2>
            <p className="font-mono text-[10.5px] text-faint">{t("privacy.sub")}</p>
          </div>
          <button onClick={onClose} className="icon-btn ms-auto" title={t("common.close")} aria-label={t("common.close")}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* guests */}
          <div className="rounded-2xl border border-gold/30 bg-gold/6 p-4">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold">
              {t("privacy.badgeGuest")}
            </span>
            <p className="mt-3 text-[13px] font-extrabold">{t("privacy.guest")}</p>
            <ul className="mt-2 space-y-2">
              {[t("privacy.reg1"), t("privacy.reg2"), t("privacy.reg3"), t("privacy.reg4")].map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-dim">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* registered */}
          <div className="rounded-2xl border border-mint/35 bg-mint/6 p-4">
            <span className="rounded-full border border-mint/45 bg-mint/12 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mint">
              {t("privacy.badgeReg")}
            </span>
            <p className="mt-3 text-[13px] font-extrabold">{t("privacy.audit")}</p>
            <ul className="mt-2 space-y-2">
              {[t("privacy.local"), t("privacy.ledger")].map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-dim">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-panel2/70 px-4 py-3.5 text-[12.5px] font-semibold leading-relaxed text-dim">
            <TokenIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {t("privacy.note")}
          </p>
        </div>
      </div>
    </div>
  );
}
