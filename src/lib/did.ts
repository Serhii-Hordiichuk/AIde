/* Self-sovereign identity: did:key over ECDSA P-256 (WebCrypto, no deps).
   Registration = keygen, login = prove possession of the private key. */

export interface Identity {
  did: string;
  pub: JsonWebKey;
  priv: JsonWebKey;
  createdAt: number;
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58btc(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += B58[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** did:key:z… from an EC P-256 public JWK (multicodec p256-pub = varint 0x80 0x24). */
export function didFromPublicJwk(pub: JsonWebKey): string {
  const x = b64urlToBytes(pub.x!);
  const y = b64urlToBytes(pub.y!);
  const raw = new Uint8Array(65);
  raw[0] = 0x04;
  raw.set(x, 1);
  raw.set(y, 33);
  const prefixed = new Uint8Array(2 + raw.length);
  prefixed[0] = 0x80;
  prefixed[1] = 0x24;
  prefixed.set(raw, 2);
  return "did:key:z" + base58btc(prefixed);
}

export function shortDid(did: string, head = 16, tail = 6): string {
  return did.length <= head + tail + 1 ? did : `${did.slice(0, head)}…${did.slice(-tail)}`;
}

/** Generate a fresh keypair and derive the DID. */
export async function createIdentity(): Promise<Identity> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { did: didFromPublicJwk(pub), pub, priv, createdAt: Date.now() };
}

export async function sign(priv: JsonWebKey, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "jwk",
    { ...priv, d: priv.d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(msg)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verify(pub: JsonWebKey, msg: string, sigB64: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const bin = atob(sigB64);
    const sig = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) sig[i] = bin.charCodeAt(i);
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      sig,
      new TextEncoder().encode(msg)
    );
  } catch {
    return false;
  }
}

/**
 * Restore an identity from a backup JSON (the file downloaded at registration).
 * Proves possession: signs a random challenge and verifies it with the public key.
 */
export async function importIdentity(payload: string): Promise<Identity> {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(payload);
  } catch {
    throw new Error("Not valid JSON — paste the backup file contents.");
  }
  const priv = (json.priv ?? json.privateKey) as JsonWebKey | undefined;
  if (!priv?.d || !priv?.x || !priv?.y) {
    throw new Error('Backup must contain a private key ("priv" JWK with d/x/y).');
  }
  const pub: JsonWebKey = { kty: "EC", crv: "P-256", x: priv.x, y: priv.y };
  const did = didFromPublicJwk(pub);

  const challenge = crypto.randomUUID();
  const sig = await sign(priv, challenge);
  const ok = await verify(pub, challenge, sig);
  if (!ok) throw new Error("Key check failed — the backup is corrupted.");

  return { did, pub, priv, createdAt: Date.now() };
}

export function identityBackup(id: Identity): string {
  return JSON.stringify(
    { app: "aide", version: 1, did: id.did, priv: id.priv, pub: id.pub, createdAt: id.createdAt },
    null,
    2
  );
}

/** Deterministic hue for the avatar, derived from the DID. */
export function didHue(did: string): number {
  let h = 0;
  for (let i = 0; i < did.length; i++) h = (h * 31 + did.charCodeAt(i)) >>> 0;
  return h % 360;
}
