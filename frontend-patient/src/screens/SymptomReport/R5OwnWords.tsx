// Owner: person 2 — design port of app/report-words.html (artboard "R5 · In your own words").
// The words are always editable in the artboard's apricot bubble; the big microphone dictates them
// (read back before saving), typing keeps them as typed. Stored { text, source }. Optional.
import { useMemo, useState } from "react";

import { useI18n } from "../../i18n/LanguageProvider";
import { useVoice } from "../../voice/VoiceProvider";
import { useReadable } from "../../voice/useReadable";

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M3 17l1-4 9-9 3 3-9 9zM12 5l3 3"
        fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  onDone: (ownWords: { text: string; source: "voice" | "typed" } | null) => void;
}

export function R5OwnWords({ onDone }: Props) {
  const { dictate } = useVoice();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"voice" | "typed">("typed");
  const [speaking, setSpeaking] = useState(false);
  const readable = useMemo(
    () => ({ heading: t("report.ownTitle"), body: t("report.ownBubble") }),
    [t],
  );
  useReadable(readable);

  const speak = async () => {
    setSpeaking(true);
    try {
      const heard = await dictate({ prompt: t("report.ownPlaceholder") });
      if (heard) {
        setText(heard);
        setSource("voice");
      }
    } finally {
      setSpeaking(false);
    }
  };

  const send = () => {
    const words = text.trim();
    if (words) onDone({ text: words, source });
  };

  return (
    <section className="own">
      <div className="screen-heading">
        <span className="eyebrow">{t("report.ownEyebrow")}</span>
        <h1>{t("report.ownTitle")}</h1>
      </div>

      <label className="own-bubble">
        <span className="own-bubble-label">
          {t("report.ownBubble")}
          <PencilIcon />
        </span>
        <textarea
          id="own-words"
          rows={4}
          value={text}
          placeholder={t("report.ownPlaceholder")}
          onChange={(e) => { setText(e.target.value); setSource("typed"); }}
        />
      </label>

      <div className="own-speak">
        <button
          type="button"
          className="own-mic"
          onClick={speak}
          disabled={speaking}
          aria-label={t("report.speak")}
        >
          <MicIcon />
        </button>
        <span className="own-speak-text">
          <span className="own-speak-title">{speaking ? t("report.listening") : t("report.speak")}</span>
          <span className="own-speak-sub">{t("report.speakSub")}</span>
        </span>
      </div>

      <div className="own-actions">
        <button
          type="button"
          className="primary own-send"
          disabled={text.trim() === ""}
          onClick={send}
        >
          {t("report.sendReport")}
        </button>
        <button type="button" className="own-skip" onClick={() => onDone(null)}>{t("report.skip")}</button>
      </div>
    </section>
  );
}
