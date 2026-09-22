import QRCode from "qrcode";

export async function generateQrDataUrl(payload: string, size = 240): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#17181c", light: "#ffffff" },
  });
}

export function qrPayloadToCode(payload: string): string {
  try {
    const parsed = JSON.parse(
      decodeURIComponent(escape(atob(payload)))
    ) as { e?: string };
    return parsed.e ? payload.slice(-10).toUpperCase() : "—";
  } catch {
    return "—";
  }
}

export function displayCode(payload: string): string {
  const clean = payload.replace(/=+$/, "").replace(/[+/]/g, "a");
  return clean.slice(-12).toUpperCase().match(/.{1,4}/g)?.join(" ") ?? "";
}