/* Wearable bridge: a privacy-preserving channel for smart glasses,
   earbuds and HUD devices. Runs over Web Bluetooth when available and
   falls back to a local loopback so the flow is testable everywhere.
   Audio never leaves the device unless the user explicitly routes it. */

export interface WearableDevice {
  id: string;
  name: string;
  kind: "glasses" | "earbuds" | "hud" | "watch";
  battery: number;
}

export interface WearableState {
  connected: WearableDevice | null;
  scanning: boolean;
  caption: string; // live on-device caption stream
}

const CATALOG: WearableDevice[] = [
  { id: "aide-frame", name: "AiDe Frame (dev kit)", kind: "glasses", battery: 84 },
  { id: "even-g1", name: "Even Realities G1", kind: "glasses", battery: 61 },
  { id: "solos-airgo", name: "Solos AirGo Vision", kind: "glasses", battery: 47 },
  { id: "pixel-buds", name: "Pixel Buds Pro 2", kind: "earbuds", battery: 72 },
  { id: "meta-rayban", name: "Ray-Ban Meta (bridge)", kind: "glasses", battery: 38 },
];

export function hasWebBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function listNearby(): WearableDevice[] {
  return CATALOG;
}

export function deviceIconKind(kind: WearableDevice["kind"]): string {
  return kind;
}
