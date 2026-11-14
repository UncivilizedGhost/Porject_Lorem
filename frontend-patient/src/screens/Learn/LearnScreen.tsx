// Owner: person 4 — .scratch/learn-sms-fhir-voice/spec.md (artboard "9 · Learn")
// Suggested questions as buttons, a labelled question box, an answer card with source chips and
// Learn's own language toggle (Selkosuomi / Svenska / English) → POST /learn/ask. Answers come
// only from the reviewed corpus on the server; safety and "ask your nurse" replies are fixed text.
// Voice actions: each suggested question, "ask" (dictation), "read answer". Open to Contacts too.
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
    title: "Learn",
    intro: "Ask about tests and what to expect. Answers come from reviewed Finnish sources.",
    label: "Your question",
    ask: "Ask",
    askVoice: "Ask by voice",
    prompt: "What would you like to know?",
    suggested: "Suggested questions",
    source: "Source",
    readAnswer: "Read answer",
    failure: "I could not reach the answer service. Please ask your nurse.",
    languageGroup: "Language",
  },
  fi: {
    title: "Opi",
    intro: "Kysy tutkimuksista ja siitä, mitä odottaa. Vastaukset perustuvat tarkistettuihin suomalaisiin lähteisiin.",
    label: "Kysymyksesi",
    ask: "Kysy",
    askVoice: "Kysy puheella",
    prompt: "Mitä haluat tietää?",
    suggested: "Ehdotetut kysymykset",
    source: "Lähde",
    readAnswer: "Lue vastaus",
    failure: "Vastauspalveluun ei saatu yhteyttä. Kysy hoitajalta.",
    languageGroup: "Kieli",
  },
  sv: {
    title: "Lär dig",
    intro: "Fråga om undersökningar och vad du kan vänta dig. Svaren kommer från granskade finländska källor.",
    label: "Din fråga",
    ask: "Fråga",
    askVoice: "Fråga med rösten",
    prompt: "Vad vill du veta?",
    suggested: "Förslag på frågor",
    source: "Källa",
    readAnswer: "Läs svaret",
    failure: "Jag nådde inte svarstjänsten. Fråga din sjuksköterska.",
    languageGroup: "Språk",
  },
};

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
    <section>
      <h1>{t.title}</h1>
      <p>{t.intro}</p>

      <div role="group" aria-label={t.languageGroup}>
        {LANGUAGES.map((l) => (
          <button key={l.code} type="button" aria-pressed={language === l.code} onClick={() => setLanguage(l.code)}>
            {l.label}
          </button>
        ))}
      </div>

      <h2>{t.suggested}</h2>
      <ul>
        {SUGGESTED[language].map((q) => (
          <li key={q}>
            <button type="button" onClick={() => void submit(q)}>
              {q}
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(question);
        }}
      >
        <label htmlFor="learn-question">{t.label}</label>
        <input id="learn-question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button type="submit" disabled={busy}>
          {t.ask}
        </button>
      </form>

      {failed && <p role="alert">{t.failure}</p>}

      {result && (
        <article aria-live="polite">
          {result.kind === "safety" ? <p role="alert">{result.text}</p> : <p>{result.text}</p>}
          {result.sources.length > 0 && (
            <p>
              {t.source}:{" "}
              {result.sources.map((s) => (
                <a key={s.passage_id} href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </p>
          )}
          <button type="button" onClick={() => readPage()}>
            {t.readAnswer}
          </button>
        </article>
      )}
    </section>
  );
}
