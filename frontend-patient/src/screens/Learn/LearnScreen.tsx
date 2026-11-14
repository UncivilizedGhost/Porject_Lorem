// Owner: person 4 — design port of app/learn.html (artboard "9 · Learn" / "Ask about your care").
// A labelled question row with Ask, the answer card with its reviewed source, and the "answers
// only come from reviewed sources" note. Answers come only from the reviewed corpus on the server
// → POST /learn/ask. Safety and "ask your nurse" replies are fixed text and never pretend to be
// an explanation.
import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../api/client";
import type { Language } from "../../api/types";
import type { Readable, VoiceAction } from "../../voice/types";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
import { useVoice } from "../../voice/VoiceProvider";

interface Source {
  label: string;
  url: string;
  passage_id: string;
}
interface LearnResult {
  kind: "answer" | "safety" | "no_source";
  text: string;
  sources: Source[];
}

const SUGGESTED: Record<Language, string[]> = {
  en: [
    "What is a bronchoscopy?",
    "What is a CT scan?",
    "What is a chest X-ray?",
    "What are the warning signs?",
    "What is the 6-week goal?",
    "Can Kela pay for my taxi?",
  ],
  fi: [
    "Mikä on bronkoskopia?",
    "Mikä on TT-kuvaus?",
    "Mikä on keuhkokuva?",
    "Mitkä ovat keuhkosyövän varoitusmerkit?",
    "Mikä on kuuden viikon tavoite?",
    "Korvaako Kela taksimatkan?",
  ],
  sv: [
    "Vad är en bronkoskopi?",
    "Vad är en datortomografi?",
    "Vad är en lungröntgen?",
    "Vilka är varningstecknen för lungcancer?",
    "Vad är sexveckorsmålet?",
    "Ersätter Fpa taxiresor?",
  ],
};

const TEXT: Record<Language, Record<string, string>> = {
  en: {
    title: "Ask about your care",
    intro: "Ask about tests and what to expect.",
    label: "Your question",
    ask: "Ask",
    askVoice: "Ask by voice",
    prompt: "What would you like to know?",
    listening: "Listening…",
    listeningStop: "Stop listening",
    suggested: "Suggested questions",
    source: "Source",
    readAnswer: "Read answer",
    failure: "I could not reach the answer service. Please ask your nurse.",
    note: "Answers come only from reviewed Finnish sources. For your own results, ask Nurse Aino.",
  },
  fi: {
    title: "Opi",
    intro: "Kysy tutkimuksista ja siitä, mitä odottaa.",
    label: "Kysymyksesi",
    ask: "Kysy",
    askVoice: "Kysy puheella",
    prompt: "Mitä haluat tietää?",
    listening: "Kuuntelee…",
    listeningStop: "Lopeta kuuntelu",
    suggested: "Ehdotetut kysymykset",
    source: "Lähde",
    readAnswer: "Lue vastaus",
    failure: "Vastauspalveluun ei saatu yhteyttä. Kysy hoitajalta.",
    note: "Vastaukset tulevat vain tarkistetuista suomalaisista lähteistä. Omista tuloksistasi kysy hoitaja Ainolta.",
  },
  sv: {
    title: "Lär dig",
    intro: "Fråga om undersökningar och vad du kan vänta dig.",
    label: "Din fråga",
    ask: "Fråga",
    askVoice: "Fråga med rösten",
    prompt: "Vad vill du veta?",
    listening: "Lyssnar…",
    listeningStop: "Sluta lyssna",
    suggested: "Förslag på frågor",
    source: "Källa",
    readAnswer: "Läs svaret",
    failure: "Jag nådde inte svarstjänsten. Fråga din sjuksköterska.",
    note: "Svaren kommer bara från granskade finländska källor. Fråga din egen sjuksköterska om dina resultat.",
  },
};

/** Microphone icon matching report-words.html "Hold to speak" button. */
function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LearnScreen() {
  const { settings, dictate, readPage } = useVoice();
  // Settings → Language drives both the copy and the language of the answer.
  const language = settings.language;
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<LearnResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dictating, setDictating] = useState(false);
  const t = TEXT[language];

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const submit = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setBusy(true);
    setFailed(false);
    try {
      setResult((await api.learnAsk({ question: text, language })) as LearnResult);
    } catch {
      setResult(null);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (isRecordingRef.current || !navigator.mediaDevices?.getUserMedia) return;
    isRecordingRef.current = true;
    audioChunksRef.current = [];
    setDictating(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (!isRecordingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setDictating(false);
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
            setQuestion(data.transcript);
          }
        } catch {
          // STT failed — leave the textbox unchanged.
        } finally {
          setDictating(false);
        }
      };
      rec.start();
    } catch {
      isRecordingRef.current = false;
      setDictating(false);
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
      setDictating(false);
    }
  };

  const actions = useMemo<VoiceAction[]>(
    () => [
      ...SUGGESTED[language].map((q) => ({ id: `learn_q_${q}`, label: q, run: () => submit(q) })),
      {
        id: "learn_ask",
        label: TEXT[language].ask,
        synonyms: [TEXT[language].askVoice],
        confirm_text: `${TEXT[language].askVoice}?`,
        run: () => {
          void (async () => {
            const heard = await dictate({ prompt: t.prompt });
            if (heard) await submit(heard);
          })();
        },
      },
      { id: "learn_read_answer", label: TEXT[language].readAnswer, run: () => readPage() },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, readPage, dictate],
  );
  useVoiceActions(actions);

  const readable = useMemo<Readable>(() => {
    if (!result) return { heading: t.title, body: t.intro };
    if (result.kind === "safety") return { priority: result.text, heading: t.title };
    const sources = result.sources.map((s) => s.label).join(", ");
    return { heading: t.title, body: sources ? `${result.text} ${t.source}: ${sources}` : result.text };
  }, [result, t]);
  useReadable(readable);

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
    <section className="learn">
      <h1>{t.title}</h1>

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(question);
        }}
      >
        <label className="ask-label" htmlFor="learn-question">
          {t.label}
          <span className="ask-row">
            <input
              id="learn-question"
              className="ask-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="button"
              className="ask-mic"
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
              disabled={busy}
              aria-label={dictating ? t.listeningStop : t.listening}
              aria-pressed={dictating}
            >
              <MicIcon />
            </button>
            <button type="submit" className="ask-button" disabled={busy}>{t.ask}</button>
          </span>
        </label>
      </form>

      <section className="ask-suggestions-wrap" aria-labelledby="suggested-label">
        <p className="ask-suggestions-label" id="suggested-label">{t.suggested}</p>
        <div className="ask-suggestions">
          {SUGGESTED[language].map((q) => (
            <button key={q} type="button" className="ask-chip" onClick={() => void submit(q)}>
              {q}
            </button>
          ))}
        </div>
      </section>

      {failed && <p className="error" role="alert">{t.failure}</p>}

      {result && (
        <article className="card learn-answer" aria-live="polite">
          {result.kind === "safety" ? (
            <p className="learn-answer-alert" role="alert">{result.text}</p>
          ) : (
            <p>{result.text}</p>
          )}

          {result.sources.length > 0 && (
            <div className="learn-source">
              <span>{t.source}</span>
              {result.sources.map((s) => (
                <a key={s.passage_id} href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <button type="button" className="learn-read" onClick={() => readPage()}>
            {t.readAnswer}
          </button>
        </article>
      )}

      <p className="learn-note">{t.note}</p>
    </section>
  );
}
