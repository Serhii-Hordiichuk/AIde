import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { claimDaily, dailyCountdown, dailyReady, fmtAide, grantReferral, requestPayout, type Wallet } from "../lib/wallet";
import { shortDid } from "../lib/did";
import { TokenIcon, XIcon, CheckIcon, CopyIcon, BoltIcon } from "./Icons";

interface Props {
  wallet: Wallet;
  setWallet: (w: Wallet) => void;
  did: string;
  onClose: () => void;
}

const KIND_STYLE: Record<string, string> = {
  earn: "text-mint",
  grant: "text-gold",
  spend: "text-coral",
  payout: "text-cyanic",
};

export default function WalletPanel({ wallet, setWallet, did, onClose }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [, force] = useState(0);

  /* refresh countdown every 30s */
  useEffect(() => {
    const id = window.setInterval(() => force((v) => v + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const ready = dailyReady(wallet);
  const countdown = dailyCountdown(wallet);

  function copyReferral() {
    const link = `https://aide.app/r/${shortDid(did)}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
    if (!wallet.refGrant) setWallet(grantReferral(wallet));
  }

  function payout() {
    const after = requestPayout(wallet, wallet.balance);
    if (after) setWallet(after);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <TokenIcon className="h-6 w-6" />
          <div>
            <h2 className="font-display text-[15px] font-bold">{t("wallet.title")}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{shortDid(did)}</p>
          </div>
          <button onClick={onClose} className="icon-btn ms-auto" title={t("common.close")} aria-label={t("common.close")}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* balance */}
          <div className="corners relative rounded-2xl border border-gold/30 bg-ink/60 p-5 text-center">
            <p className="overline">{t("wallet.balance")}</p>
            <p className="mt-2 font-display text-[38px] font-bold leading-none text-gold">{fmtAide(wallet.balance)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => ready && setWallet(claimDaily(wallet))}
                disabled={!ready}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-extrabold transition-all ${
                  ready ? "btn-brand" : "border border-line text-faint"
                }`}
              >
                <BoltIcon className="h-3.5 w-3.5" />
                {ready ? t("wallet.claim") : `${t("wallet.claimedIn")} ${countdown}`}
              </button>
              <button
                onClick={copyReferral}
                className="row-hl flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[12.5px] font-extrabold text-dim hover:text-text"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
                {wallet.refGrant ? t("wallet.referralDone") : t("wallet.referralCopy")}
              </button>
            </div>
          </div>

          {/* payout */}
          <div className="mt-4 rounded-2xl border border-line bg-panel2/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-extrabold">{t("wallet.payout")}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-faint">{t("wallet.payoutNote")}</p>
              </div>
              <button
                onClick={payout}
                disabled={wallet.balance <= 0}
                className="btn-brand shrink-0 rounded-xl px-4 py-2.5 text-[12.5px] font-extrabold disabled:opacity-35"
              >
                {t("wallet.payoutBtn")}
              </button>
            </div>
          </div>

          {/* ledger */}
          <p className="overline mb-2 mt-5">{t("wallet.txs")}</p>
          {wallet.txs.length === 0 ? (
            <p className="py-6 text-center font-mono text-[11.5px] text-faint">{t("wallet.txEmpty")}</p>
          ) : (
            <ul className="space-y-1.5">
              {wallet.txs.slice(0, 30).map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel2/50 px-3.5 py-2.5">
                  <span className={`font-mono text-[13px] font-bold ${tx.amount >= 0 ? "text-mint" : "text-coral"}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount % 1 === 0 ? tx.amount : tx.amount.toFixed(1)} Ⓐ
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-text">{tx.note}</span>
                    <span className={`font-mono text-[9.5px] uppercase tracking-wider ${KIND_STYLE[tx.kind] ?? "text-faint"}`}>{tx.kind}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    {new Date(tx.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-line px-5 py-3 text-center font-mono text-[10px] text-faint">{t("wallet.privacy")}</p>
      </div>
    </div>
  );
}
