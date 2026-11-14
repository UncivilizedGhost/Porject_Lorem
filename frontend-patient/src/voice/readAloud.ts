// Owner: person 4 — Read-aloud player: POST /voice/tts first; on failure or 503 the browser's
// speechSynthesis in the same language. Two speeds. Stops when the screen changes.
import type { Readable } from "./types";
import { fetchTts } from "./voiceApi";

const BROWSER_LANG: Record<string, string> = { fi: "fi-FI", sv: "sv-SE", en: "en-GB" };

let generation = 0; // bumped by stopSpeaking(): anything started earlier stays silent
let currentAudio: HTMLAudioElement | null = null;

/** Priority (safety / "Call now") first, then the heading, then the body. */
export function readingOrder(r: Readable): string[] {
  return [r.priority, r.heading, r.body].filter((s): s is string => Boolean(s && s.trim()));
}

function playBlob(blob: Blob, mine: number): Promise<void> {
  return new Promise((resolve) => {
    if (mine !== generation) return resolve();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    const done = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

function browserSpeak(text: string, language: string, speed: "normal" | "slow", mine: number): Promise<void> {
  return new Promise((resolve) => {
    if (mine !== generation || typeof speechSynthesis === "undefined") return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BROWSER_LANG[language] ?? "en-GB";
    u.rate = speed === "slow" ? 0.8 : 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export async function speak(text: string, language: string, speed: "normal" | "slow"): Promise<void> {
  const mine = generation;
  let blob: Blob | null = null;
  try {
    blob = await fetchTts(text, language, speed);
  } catch {
    blob = null; // offline or server down: use the browser's own voice
  }
  if (mine !== generation) return;
  if (blob) return playBlob(blob, mine);
  return browserSpeak(text, language, speed, mine);
}

export function stopSpeaking(): void {
  generation += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}
