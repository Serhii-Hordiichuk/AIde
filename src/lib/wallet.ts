/* AIDE token ledger — local-first, transparent by design.
   Every credit/debit is an append-only entry the user can inspect. */

export type TxKind = "earn" | "spend" | "grant" | "payout";

export interface Tx {
  id: string;
  kind: TxKind;
  amount: number; // AIDE, negative = outflow
  note: string;
  at: number;
}

export interface Wallet {
  balance: number;
  txs: Tx[];
  lastDaily?: number;
  refGrant?: boolean;
}

const KEY = "aide.wallet";
const DAY = 24 * 60 * 60 * 1000;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function loadWallet(): Wallet {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Wallet;
  } catch {
    /* ignore */
  }
  const w: Wallet = {
    balance: 25,
    txs: [{ id: uid(), kind: "grant", amount: 25, note: "welcome grant", at: Date.now() }],
  };
  saveWallet(w);
  return w;
}

export function saveWallet(w: Wallet) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* ignore */
  }
}

function push(w: Wallet, kind: TxKind, amount: number, note: string): Wallet {
  const tx: Tx = { id: uid(), kind, amount, note, at: Date.now() };
  const next: Wallet = { ...w, balance: w.balance + amount, txs: [tx, ...w.txs].slice(0, 120) };
  saveWallet(next);
  return next;
}

export function credit(w: Wallet, amount: number, note: string, kind: TxKind = "earn"): Wallet {
  return push(w, kind, amount, note);
}

export function debit(w: Wallet, amount: number, note: string): Wallet | null {
  if (w.balance < amount) return null;
  return push(w, "spend", -amount, note);
}

/* daily claim: +2 AIDE once per 24h */
export function dailyReady(w: Wallet): boolean {
  return !w.lastDaily || Date.now() - w.lastDaily >= DAY;
}

export function dailyCountdown(w: Wallet): string {
  if (!w.lastDaily) return "";
  const left = Math.max(0, w.lastDaily + DAY - Date.now());
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function claimDaily(w: Wallet): Wallet {
  if (!dailyReady(w)) return w;
  const next = push(w, "grant", 2, "daily check-in");
  next.lastDaily = Date.now();
  saveWallet(next);
  return next;
}

/* referral grant: +1 AIDE once, when the link is shared */
export function grantReferral(w: Wallet): Wallet {
  if (w.refGrant) return w;
  const next = push(w, "grant", 1, "referral link shared");
  next.refGrant = true;
  saveWallet(next);
  return next;
}

/* payout request: queues an outflow settled to the user's DID */
export function requestPayout(w: Wallet, amount: number): Wallet | null {
  const amt = Math.min(Math.floor(amount * 10) / 10, w.balance);
  if (amt <= 0) return null;
  return push(w, "payout", -amt, "payout to DID · queued");
}

export function fmtAide(n: number): string {
  return `${n % 1 === 0 ? n : n.toFixed(1)} Ⓐ`;
}
