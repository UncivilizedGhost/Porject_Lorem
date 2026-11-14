// Owner: person 4 — Read-aloud player: POST /voice/tts first; on failure or 503 the browser's
// speechSynthesis in the same language. Two speeds. Stops when the screen changes.
export async function speak(_text: string, _language: string, _speed: "normal" | "slow"): Promise<void> {
  // TODO(person 4)
}

export function stopSpeaking(): void {
  // TODO(person 4)
}
