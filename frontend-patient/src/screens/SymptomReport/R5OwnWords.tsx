// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R5 · In your own words (optional)")
// "Hold to speak" first (voice dictate(), read back before saving), "type instead" second
// (textarea). Stored { text, source }. Skippable.
import { useMemo, useState } from "react";

import { useReadable } from "../../voice/useReadable";
import { useVoice } from "../../voice/VoiceProvider";

interface Props {
  onDone: (ownWords: { text: string; source: "voice" | "typed" } | null) => void;
}

export function R5OwnWords({ onDone }: Props) {
  const { dictate } = useVoice();
  const [mode, setMode] = useState<"choose" | "typing" | "readback">("choose");
  const [text, setText] = useState("");
  const [heard, setHeard] = useState("");
  const readable = useMemo(
    () => ({ heading: "Anything else you want to tell the nurse?", body: "You can speak or type. This is optional." }),
    [],
  );
  useReadable(readable);

  const speak = async () => {
    const result = await dictate({ prompt: "Tell the nurse in your own words" });
    if (result) {
      setHeard(result);
      setMode("readback");
    }
  };

  return (
    <section>
      <h1>Anything else you want to tell the nurse?</h1>
      <p>In your own words. This is optional, and the nurse reads it as you said it.</p>
      {mode === "choose" && (
        <>
          <button type="button" className="primary" onClick={speak}>Hold to speak</button>
          <button type="button" onClick={() => setMode("typing")}>Type instead</button>
        </>
      )}
      {mode === "typing" && (
        <>
          <label htmlFor="own-words">Your own words</label>
          <textarea id="own-words" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          <button
            type="button"
            className="primary"
            disabled={text.trim() === ""}
            onClick={() => onDone({ text: text.trim(), source: "typed" })}
          >
            Send my report
          </button>
        </>
      )}
      {mode === "readback" && (
        <>
          <p>I heard: <q>{heard}</q></p>
          <button type="button" className="primary" onClick={() => onDone({ text: heard, source: "voice" })}>
            Yes, send my report
          </button>
          <button type="button" onClick={speak}>Say it again</button>
        </>
      )}
      <button type="button" onClick={() => onDone(null)}>Skip</button>
    </section>
  );
}
