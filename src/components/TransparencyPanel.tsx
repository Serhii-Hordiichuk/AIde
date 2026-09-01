import { useI18n } from "../lib/i18n";
import { XIcon, CheckIcon, KeyIcon } from "./Icons";

interface Props {
  onClose: () => void;
}

/* Data & privacy ledger — the platform's plain-word contract with the user. */
export default function TransparencyPanel({ onClose }: Props) {
  const { t } = useI18n();

  const never = [t("privacy.never1"), t("privacy.never2"), t("privacy.never3")];
  const you = [t("privacy.you1"), t("privacy.you2"), t("privacy.you3")];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl">
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {/* private by default */}
          <section className="corners relative rounded-2xl border border-mint/30 bg-mint/5 p-4">
            <h3 className="text-[13.5px] font-extrabold text-mint">{t("privacy.privateTitle")}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{t("privacy.privateBody")}</p>
          </section>

          {/* guest contributions */}
          <section className="corners relative rounded-2xl border border-gold/30 bg-gold/5 p-4">
            <h3 className="text-[13.5px] font-extrabold text-gold">{t("privacy.guestTitle")}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{t("privacy.guestBody")}</p>
          </section>

          {/* living language research */}
          <section className="corners relative rounded-2xl border border-violet/30 bg-violet/5 p-4">
            <h3 className="text-[13.5px] font-extrabold text-violet2">{t("privacy.slangTitle")}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{t("privacy.slangBody")}</p>
          </section>

          {/* never / always */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4">
              <h3 className="text-[13px] font-extrabold text-coral">{t("privacy.never")}</h3>
              <ul className="mt-2 space-y-1.5">
                {never.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-[12px] leading-snug text-dim">
                    <XIcon className="mt-0.5 h-3 w-3 shrink-0 text-coral" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-mint/30 bg-mint/5 p-4">
              <h3 className="text-[13px] font-extrabold text-mint">{t("privacy.you")}</h3>
              <ul className="mt-2 space-y-1.5">
                {you.map((y) => (
                  <li key={y} className="flex items-start gap-2 text-[12px] leading-snug text-dim">
                    <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-mint" />
                    {y}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line px-5 py-3">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            aide · local-first · did:key
          </p>
        </div>
      </div>
    </div>
  );
}
