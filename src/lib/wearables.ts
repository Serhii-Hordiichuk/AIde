/* Bridge for smart glasses & wearable interpreters.
   Uses Web Bluetooth when available; otherwise a local demo bridge so the
   captioning flow can be experienced anywhere. Audio never leaves the device. */

export interface WearableDevice {
  id: string;
  name: string;
  kind: "glasses" | "earbuds" | "hud" | "watch";
}

export const DEMO_DEVICES: WearableDevice[] = [
  { id: "w1", name: "Even Realities G1", kind: "glasses" },
  { id: "w2", name: "Ray-Ban Meta", kind: "glasses" },
  { id: "w3", name: "XREAL Air 2", kind: "hud" },
  { id: "w4", name: "Timekettle W4", kind: "earbuds" },
];

export function hasWebBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export async function listNearby(): Promise<WearableDevice[]> {
  return DEMO_DEVICES;
}

export async function requestDevice(): Promise<boolean> {
  if (!hasWebBluetooth()) return false;
  try {
    await (navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<unknown> } }).bluetooth.requestDevice({
      acceptAllDevices: true,
    });
    return true;
  } catch {
    return false;
  }
}
