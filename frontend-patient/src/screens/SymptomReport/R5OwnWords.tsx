// Owner: person 2 — design port of app/report-words.html (artboard "R5 · In your own words").
// The words are always editable in the artboard's apricot bubble; hold-to-speak dictates them
// (read back before saving), typing keeps them as typed. Stored { text, source }. Optional.
import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../api/client";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";

interface Props {
  onDone: (ownWords: { text: string; source: "voice" | "typed" } | null) => void;
}

export function R5OwnWords({ onDone }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"voice" | "typed">("typed");
  const [speaking, setSpeaking] = useState(false);
  const readable = useMemo(
    () => ({ heading: t("report.ownTitle"), body: t("report.ownBubble") }),
    [t],
  );
  useReadable(readable);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const startRecording = async () => {
    if (isRecordingRef.current || !navigator.mediaDevices?.getUserMedia) return;
    isRecordingRef.current = true;
    audioChunksRef.current = [];
    setSpeaking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (!isRecordingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setSpeaking(false);
        return;
      }
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        try {
          const res = await api.stt(form);
          const data = await res.json();
          if (data.transcript) {
            setText(data.transcript);
            setSource("voice");
          }
        } catch {
          // STT failed — leave the textbox unchanged.
        } finally {
          setSpeaking(false);
        }
      };
      rec.start();
    } catch {
      isRecordingRef.current = false;
      setSpeaking(false);
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      isRecordingRef.current = false;
      setSpeaking(false);
    }
  };

  const send = () => {
    const words = text.trim();
    if (words) onDone({ text: words, source });
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <section className="own">
      <div className="screen-heading">
        <span className="eyebrow">{t("report.ownEyebrow")}</span>
        <h1>{t("report.ownTitle")}</h1>
      </div>

      <label className="own-bubble">
        <span className="own-bubble-label">
          {t("report.ownBubble")}
          <Icon name="pencil" size={20} />
        </span>
        <textarea
          id="own-words"
          rows={4}
          value={text}
          placeholder={t("report.ownPlaceholder")}
          onChange={(e) => { setText(e.target.value); setSource("typed"); }}
        />
        <button
          type="button"
          className="own-mic own-mic-bubble"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(e) => {
            e.preventDefault();
            void startRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopRecording();
          }}
          disabled={speaking}
          aria-label={speaking ? t("report.speakStop") : t("report.speak")}
          aria-pressed={speaking}
        >
          <Icon name="mic" size={30} />
        </button>
      </label>

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
