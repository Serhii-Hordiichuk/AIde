/* Self-sovereign identity: an ECDSA P-256 keypair generated on-device,
   expressed as a W3C did:key. Nothing ever leaves the browser. */

export interface Identity {
  did: string;
  priv: { d: string; x: string; y: string };
  createdAt: number;
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function b58encode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = "";
  while (num > 0n) {
    out = B58[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = "1" + out;
    else break;
  }
  return out;
}

function b64uToBytes(b64: string): Uint8Array {
  const b64s = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64s + "=".repeat((4 - (b64s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function compressPoint(xB64: string, yB64: string): Uint8Array {
  const x = b64uToBytes(xB64);
  const y = b64uToBytes(yB64);
  const out = new Uint8Array(33);
  out[0] = y[y.length - 1] % 2 === 0 ? 0x02 : 0x03;
  out.set(x, 1);
  return out;
}

function didFromJwk(jwk: { x: string; y: string }): string {
  const pk = compressPoint(jwk.x, jwk.y);
  const full = new Uint8Array(2 + pk.length);
  full[0] = 0x80;
  full[1] = 0x24;
  full.set(pk, 2);
  return "did:key:z" + b58encode(full);
}

export async function createIdentity(): Promise<Identity> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const did = didFromJwk({ x: jwk.x!, y: jwk.y! });
  await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, new TextEncoder().encode("aide:" + did));
  return { did, priv: { d: jwk.d!, x: jwk.x!, y: jwk.y! }, createdAt: Date.now() };
}

export function identityBackup(id: Identity): string {
  return JSON.stringify({ app: "aide", v: 1, did: id.did, priv: id.priv, createdAt: id.createdAt }, null, 2);
}

export async function importIdentity(text: string): Promise<Identity> {
  let parsed: { app?: string; did?: string; priv?: { d?: string; x?: string; y?: string } };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("invalid backup file");
  }
  if (parsed.app !== "aide" || !parsed.did?.startsWith("did:key:z") || !parsed.priv?.d || !parsed.priv?.x || !parsed.priv?.y) {
    throw new Error("invalid backup file");
  }
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", d: parsed.priv.d, x: parsed.priv.x, y: parsed.priv.y };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode("aide:" + parsed.did));
  const reDerived = didFromJwk({ x: parsed.priv.x, y: parsed.priv.y });
  if (reDerived !== parsed.did) throw new Error("DID does not match the key");
  return { did: parsed.did, priv: { d: parsed.priv.d, x: parsed.priv.x, y: parsed.priv.y }, createdAt: Date.now() };
}

export function shortDid(did: string): string {
  return did.length > 26 ? did.slice(0, 18) + "…" + did.slice(-6) : did;
}
