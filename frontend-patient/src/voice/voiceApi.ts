// Owner: person 4 — the browser only ever talks to our server's /voice proxy (ADR-0005).
// Kept free of api/client.ts so the client can import voice context without an import cycle.
import { clientId } from "../api/clientId";

const BASE = "/api/voice";

/** Audio from the server, or null when the voice service is unavailable (503 → browser fallback). */
export async function fetchTts(text: string, language: string, speed: "normal" | "slow"): Promise<Blob | null> {
  const res = await fetch(`${BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Id": clientId() },
    body: JSON.stringify({ text, language, speed }),
  });
  return res.ok ? res.blob() : null;
}

/** Transcript of a short recording, or null when speech-to-text is unavailable. Audio is not kept. */
export async function fetchStt(audio: Blob, language: string): Promise<string | null> {
  const form = new FormData();
  form.append("audio", audio, "speech.webm");
  form.append("language", language);
  const res = await fetch(`${BASE}/stt`, { method: "POST", headers: { "X-Client-Id": clientId() }, body: form });
  if (!res.ok) return null;
  const body = (await res.json()) as { transcript?: string };
  return body.transcript ?? "";
}
