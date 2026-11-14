// Owner: person 4 — hold-to-talk microphone (≥56 px) above the bottom bar, shown only when
// Voice Mode is on. Never always-listening: hold records (MediaRecorder), release posts to
// /voice/stt, transcript goes to the matcher, match is read back and runs after "yes".
import { useRef, useState } from "react";

import { type Recording, startRecording } from "./recorder";
import { useVoice } from "./VoiceProvider";
import { fetchStt } from "./voiceApi";

const LABEL = {
  en: { idle: "Hold to speak", live: "Listening… release to send", busy: "One moment…" },
  fi: { idle: "Pidä painettuna ja puhu", live: "Kuuntelen… vapauta lähettääksesi", busy: "Hetki…" },
  sv: { idle: "Håll intryckt och tala", live: "Lyssnar… släpp för att skicka", busy: "Ett ögonblick…" },
} as const;

export function HoldToTalkButton() {
  const { settings, handleTranscript, reportVoiceUnavailable } = useVoice();
  const [state, setState] = useState<"idle" | "live" | "busy">("idle");
  const recording = useRef<Recording | null>(null);
  const held = useRef(false);

  if (!settings.voice_mode) return null;
  const text = LABEL[settings.language] ?? LABEL.en;

  const begin = async () => {
    held.current = true;
    setState("live");
    try {
      const r = await startRecording();
      if (!held.current) {
        await r.stop(); // released before the microphone opened: discard
        return;
      }
      recording.current = r;
    } catch {
      held.current = false;
      setState("idle");
      await reportVoiceUnavailable();
    }
  };

  const end = async () => {
    held.current = false;
    const r = recording.current;
    recording.current = null;
    if (!r) {
      setState("idle");
      return;
    }
    setState("busy");
    try {
      const audio = await r.stop();
      const transcript = await fetchStt(audio, settings.language);
      if (transcript === null) await reportVoiceUnavailable();
      else if (transcript.trim()) await handleTranscript(transcript);
    } catch {
      await reportVoiceUnavailable();
    } finally {
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      className="hold-to-talk"
      aria-label={text.idle}
      aria-pressed={state === "live"}
      style={{ minWidth: 56, minHeight: 56, touchAction: "none" }}
      onPointerDown={begin}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={() => held.current && void end()}
    >
      {text[state]}
    </button>
  );
}
