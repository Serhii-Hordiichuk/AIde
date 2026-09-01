/* AIDE token ledger — local-first, transparent by design.
   Every credit/debit is an append-only entry the user can inspect. */

export interface Tx {
  id: string;
  kind: "earn" | "spend" | "grant" | "payout";
  amount: number; // AIDE
  note: string;
  at: number;
}

export interface Wallet {
  balance: number;
  txs: Tx[];
}

const KEY = "aide.wallet";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function loadWallet(): Wallet {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Wallet;
  } catch {
    /* ignore */
  }
  // welcome grant so the economy is tangible from the first second
  return {
    balance: 25,
    txs: [
      { id: uid(), kind: "grant", amount: 25, note: "welcome grant", at: Date.now() },
    ],
  };
}

export function saveWallet(w: Wallet) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* ignore */
  }
}

export function credit(w: Wallet, amount: number, note: string, kind: Tx["kind"] = "earn"): Wallet {
  const tx: Tx = { id: uid(), kind, amount, note, at: Date.now() };
  const next: Wallet = {
    balance: w.balance + amount,
    txs: [tx, ...w.txs].slice(0, 100),
  };
  saveWallet(next);
  return next;
}

export function debit(w: Wallet, amount: number, note: string): Wallet | null {
  if (w.balance < amount) return null;
  const tx: Tx = { id: uid(), kind: "spend", amount: -amount, note, at: Date.now() };
  const next: Wallet = {
    balance: w.balance - amount,
    txs: [tx, ...w.txs].slice(0, 100),
  };
  saveWallet(next);
  return next;
}

export function fmtAide(n: number): string {
  return `${n % 1 === 0 ? n : n.toFixed(1)} Ⓐ`;
}
