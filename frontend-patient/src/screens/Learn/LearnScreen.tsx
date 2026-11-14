// Owner: person 4 — design port of app/learn.html (artboard "9 · Learn" / "Ask about your care").
// A labelled question row with Ask, answer-language tiles (Selkosuomi / Svenska / English), the
// answer card with its reviewed source, and the "answers only come from reviewed sources" note.
// Answers come only from the reviewed corpus on the server → POST /learn/ask. Safety and
// "ask your nurse" replies are fixed text and never pretend to be an explanation.
import { useMemo, useState } from "react";

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

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "fi", label: "Selkosuomi" },
  { code: "sv", label: "Svenska" },
  { code: "en", label: "English" },
];

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
    suggested: "Suggested questions",
    source: "Source",
    readAnswer: "Read answer",
    failure: "I could not reach the answer service. Please ask your nurse.",
    languageGroup: "Answer language",
    note: "Answers come only from reviewed Finnish sources. For your own results, ask Nurse Aino.",
  },
  fi: {
    title: "Opi",
    intro: "Kysy tutkimuksista ja siitä, mitä odottaa.",
    label: "Kysymyksesi",
    ask: "Kysy",
    askVoice: "Kysy puheella",
    prompt: "Mitä haluat tietää?",
    suggested: "Ehdotetut kysymykset",
    source: "Lähde",
    readAnswer: "Lue vastaus",
    failure: "Vastauspalveluun ei saatu yhteyttä. Kysy hoitajalta.",
    languageGroup: "Vastauksen kieli",
    note: "Vastaukset tulevat vain tarkistetuista suomalaisista lähteistä. Omista tuloksistasi kysy hoitaja Ainolta.",
  },
  sv: {
    title: "Lär dig",
    intro: "Fråga om undersökningar och vad du kan vänta dig.",
    label: "Din fråga",
    ask: "Fråga",
    askVoice: "Fråga med rösten",
    prompt: "Vad vill du veta?",
    suggested: "Förslag på frågor",
    source: "Källa",
    readAnswer: "Läs svaret",
    failure: "Jag nådde inte svarstjänsten. Fråga din sjuksköterska.",
    languageGroup: "Svarens språk",
    note: "Svaren kommer bara från granskade finländska källor. Fråga din egen sjuksköterska om dina resultat.",
  },
};

/** Small SVG flags instead of emoji: flag emoji do not render on Windows. */
function FlagIcon({ code }: { code: Language }) {
  if (code === "fi") {
    return (
      <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
        <rect width="30" height="20" fill="#ffffff" />
        <rect x="9" y="0" width="4" height="20" fill="#002F6C" />
        <rect x="0" y="8" width="30" height="4" fill="#002F6C" />
      </svg>
    );
  }
  if (code === "sv") {
    return (
      <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
        <rect width="30" height="20" fill="#006AA7" />
        <rect x="9" y="0" width="4" height="20" fill="#FECC02" />
        <rect x="0" y="8" width="30" height="4" fill="#FECC02" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="2" />
      <rect x="12" y="0" width="6" height="20" fill="#ffffff" />
      <rect x="0" y="7" width="30" height="6" fill="#ffffff" />
      <rect x="13.5" y="0" width="3" height="20" fill="#C8102E" />
      <rect x="0" y="8.5" width="30" height="3" fill="#C8102E" />
    </svg>
  );
}

function CheckDot({ on }: { on: boolean }) {
  return on ? (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.5 3.5 6.5-7" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function LearnScreen() {
  const { settings, dictate, readPage } = useVoice();
  const [language, setLanguage] = useState<Language>(settings.language);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<LearnResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = TEXT[language];

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

  const dictateAndAsk = async () => {
    const heard = await dictate({ prompt: t.prompt });
    if (heard) await submit(heard);
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
          void dictateAndAsk(); // not awaited: it waits for the next spoken turns
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
            <button type="submit" className="ask-button" disabled={busy}>{t.ask}</button>
          </span>
        </label>
      </form>

      <fieldset className="opt-fieldset">
        <legend>{t.languageGroup}</legend>
        <div className="opt-grid cols-3">
          {LANGUAGES.map((l) => (
            <label key={l.code} className="opt answer-language" data-selected={language === l.code}>
              <input
                type="radio"
                name="answer-language"
                checked={language === l.code}
                onChange={() => setLanguage(l.code)}
              />
              <span className="opt-icons">
                <span className="opt-icon opt-flag"><FlagIcon code={l.code} /></span>
                <span className="opt-check"><CheckDot on={language === l.code} /></span>
              </span>
              <span className="opt-label">{l.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
