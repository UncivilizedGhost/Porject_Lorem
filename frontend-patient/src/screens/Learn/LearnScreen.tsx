// Owner: person 4 — .scratch/learn-sms-fhir-voice/spec.md (artboard "9 · Learn")
// Learn knowledge base: answers questions only by rephrasing retrieved passages from the
// allowed local corpus and always shows the source. Red-flag questions get a fixed safety
// message (never a generated answer). With no source, shows "ask your nurse" + number.
// Calls POST /learn/ask; falls back to the local corpus when the API is unreachable so the
// demo keeps working. Open to Contacts, Patients and Trusted People. Learn's own language
// toggle: Selkosuomi / Svenska / English. Registers voice actions (suggested questions,
// "ask" dictation, "read answer").

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../../api/client";
import { useVoice } from "../../voice/VoiceProvider";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";
import type { VoiceAction } from "../../voice/types";
import { containsRedFlag } from "../../voice/redFlags";
import { findPassages, type Lang } from "./learnCorpus";

type LearnKind = "answer" | "safety" | "no_source";

interface LearnResponse {
  kind: LearnKind;
  text: string;
  sources?: Array<{ label: string; url?: string; passage_id?: string }>;
  language?: string;
}

const NURSE = { name: "Nurse Aino", phone: "+15550100" };

const SUGGESTED: Record<Lang, string[]> = {
  en: [
    "What is a bronchoscopy?",
    "What is cancer?",
    "What are the symptoms of lung cancer?",
    "What is a CT scan?",
    "What is a chest X-ray?",
    "How is lung cancer diagnosed?",
    "How is lung cancer treated?",
    "What is the outlook and survival?",
    "What are the risk factors of lung cancer?",
    "What should I bring to a hospital visit?",
    "Can someone come with me to appointments?",
    "Can I get help with travel costs?",
  ],
  fi: [
    "Mikä on keuhkoputkien tähystys?",
    "Mikä on syöpä?",
    "Mitä ovat keuhkosyövän oireet?",
    "Mikä on TT-tutkimus?",
    "Mikä on keuhkoröntgenkuva?",
    "Miten keuhkosyöpä todetaan?",
    "Miten keuhkosyöpää hoidetaan?",
    "Mikä on ennuste?",
    "Mitä ovat keuhkosyövän riskitekijät?",
    "Mitä otan mukaan sairaalakäynnille?",
    "Voiko joku tulla mukaan käynnille?",
    "Voinko saada apua matkakustannuksiin?",
  ],
  sv: [
    "Vad är en bronkoskopi?",
    "Vad är cancer?",
    "Vilka är symtomen på lungcancer?",
    "Vad är en CT-skning?",
    "Vad är en lungröntgen?",
    "Hur diagnostiseras lungcancer?",
    "Hur behandlas lungcancer?",
    "Vad är prognosen?",
    "Vilka är riskfaktorerna för lungcancer?",
    "Vad ska jag ta med till sjukhusbesöket?",
    "Kan någon följa med mig på besöken?",
    "Kan jag få hjälp med resekostnader?",
  ],
};

const UI: Record<Lang, Record<string, string>> = {
  en: {
    title: "Learn 📚",
    subtitle: "Plain-language answers from reviewed sources.",
    language: "Answer language",
    english: "English",
    selkosuomi: "Selkosuomi",
    svenska: "Svenska",
    suggested: "Suggested questions",
    askLabel: "Ask a question",
    askPlaceholder: "Type your question…",
    askButton: "Ask",
    dictatedLabel: "Ask by voice",
    answer: "Answer",
    source: "Source",
    sources: "Sources",
    readAloud: "🔊 Read aloud",
    clear: "✕ Clear",
    noSource: "No reviewed answer",
    noSourceBody:
      "I don’t have a reviewed answer for that question, so I won’t guess. Please ask your nurse. " +
      `${NURSE.name} is available on weekdays 8–16: ${NURSE.phone}.`,
    safety: "⚠ Safety message",
    safetyBody:
      "This sounds like something you should not wait on. If you feel very unwell right now, call 112 immediately. " +
      "If you are worried but not in immediate danger, call 116 117 (Päivystysapu) day or night. " +
      "This app cannot tell you what is causing your symptoms. Please speak to a nurse or doctor — do not wait for an answer here.",
    call112: "📞 Call 112",
    call116117: "📞 Call 116 117",
    callNurse: `📞 Call ${NURSE.name}`,
    messageNurse: "💬 Message",
    notEmergency: "General information only. It cannot diagnose you or change your care.",
  },
  fi: {
    title: "Opi 📚",
    subtitle: "Selkokielisiä vastauksia tarkistetuista lähteistä.",
    language: "Vastauksen kieli",
    english: "Englanti",
    selkosuomi: "Selkosuomi",
    svenska: "Svenska",
    suggested: "Ehdotetut kysymykset",
    askLabel: "Kysy kysymys",
    askPlaceholder: "Kirjoita kysymyksesi…",
    askButton: "Kysy",
    dictatedLabel: "Kysy puhumalla",
    answer: "Vastaus",
    source: "Lähde",
    sources: "Lähteet",
    readAloud: "🔊 Lue ääneen",
    clear: "✕ Tyhjennä",
    noSource: "Ei tarkistettua vastausta",
    noSourceBody:
      "Minulla ei ole tarkistettua vastausta tuohon kysymykseen, joten en arvaa. Kysy hoitajaltasi. " +
      `${NURSE.name} on tavoitettavissa arkisin klo 8–16: ${NURSE.phone}.`,
    safety: "⚠ Turvaviesti",
    safetyBody:
      "Tämä kuulostaa siltä, ettei sinun kannata odottaa. Jos voit huonosti juuri nyt, soita heti 112. " +
      "Jos olet huolissasi muttei kyse ole välittömästä vaarasta, soita päivystysapuun 116 117 ympäri vuorokauden. " +
      "Tämä sovellus ei voi kertoa, mikä oireitasi aiheuttaa. Puhu hoitajan tai lääkärin kanssa — älä odota vastausta täältä.",
    call112: "📞 Soita 112",
    call116117: "📞 Soita 116 117",
    callNurse: `📞 Soita ${NURSE.name}`,
    messageNurse: "💬 Viesti",
    notEmergency: "Yleistä tietoa vain. Se ei voi diagnosoida sinua tai muuttaa hoitoasi.",
  },
  sv: {
    title: "Lär dig mer 📚",
    subtitle: "Enkla svar från granskade källor.",
    language: "Svarsspråk",
    english: "Engelska",
    selkosuomi: "Selkosuomi",
    svenska: "Svenska",
    suggested: "Föreslagna frågor",
    askLabel: "Ställ en fråga",
    askPlaceholder: "Skriv din fråga…",
    askButton: "Fråga",
    dictatedLabel: "Ställ frågan med rösten",
    answer: "Svar",
    source: "Källa",
    sources: "Källor",
    readAloud: "🔊 Läs högt",
    clear: "✕ Rensa",
    noSource: "Inget granskat svar",
    noSourceBody:
      "Jag har inget granskat svar på den frågan, så jag gissar inte. Fråga din sjuksköterska. " +
      `${NURSE.name} är tillgänglig vardagar 8–16: ${NURSE.phone}.`,
    safety: "⚠ Säkerhetsmeddelande",
    safetyBody:
      "Det här låter som något du inte bör vänta med. Om du mår mycket dåligt just nu, ring 112 omedelbart. " +
      "Om du är orolig men inte i omedelbar fara, ring 116 117 (jourhjälpen) dag och natt. " +
      "Den här appen kan inte säga vad som orsakar dina symtom. Prata med en sjuksköterska eller läkare — vänta inte på ett svar här.",
    call112: "📞 Ring 112",
    call116117: "📞 Ring 116 117",
    callNurse: `📞 Ring ${NURSE.name}`,
    messageNurse: "💬 Meddelande",
    notEmergency: "Allmän information bara. Den kan inte diagnostisera dig eller ändra din vård.",
  },
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9åäöé ]/g, " ").replace(/\s+/g, " ").trim();
}

export function LearnScreen() {
  const { dictate } = useVoice();
  const [language, setLanguage] = useState<Lang>("en");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{
    kind: LearnKind;
    text: string;
    sources: Array<{ label: string; url?: string }>;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLElement>(null);
  const speakRef = useRef<(() => void) | null>(null);
  const currentLangRef = useRef(language);

  useReadable({
    heading: UI[language].title,
    body: answer ? answer.text : UI[language].subtitle,
    priority: answer?.kind === "safety" ? answer.text : undefined,
  });

  const suggested = SUGGESTED[language];
  const t = UI[language];

  const voiceActions: VoiceAction[] = [
    ...suggested.map((q) => ({
      id: `ask-${norm(q)}`,
      label: q,
      confirm_text: `Ask "${q}"?`,
      run: () => askProgrammatically(q),
    })),
    {
      id: "ask-by-voice",
      label: t.dictatedLabel,
      synonyms: ["ask", "ask by voice", "kysy", "kysy puhumalla", "fråga", "fråga med rösten"],
      run: askByVoice,
    },
    ...(answer
      ? [
          {
            id: "read-answer",
            label: t.readAloud,
            synonyms: ["read answer", "read aloud", "lue vastaus", "lue ääneen", "läs svar", "läs högt"],
            run: speakAnswer,
          },
        ]
      : []),
  ];

  useVoiceActions(voiceActions);

  const askSuggested = useCallback((q: string) => {
    setQuestion(q);
    askProgrammatically(q);
  }, [language]);

  async function askProgrammatically(q: string) {
    if (!q.trim()) return;
    setBusy(true);
    const ui = UI[language];
    try {
      if (containsRedFlag(q, language)) {
        setAnswer({ kind: "safety", text: ui.safetyBody, sources: [] });
        currentLangRef.current = language;
        return;
      }
      let data: LearnResponse;
      try {
        data = (await api.learnAsk({ question: q, language })) as LearnResponse;
      } catch {
        // API unreachable: fall back to the local corpus.
        const hits = findPassages(q, language);
        if (hits.length === 0) {
          setAnswer({ kind: "no_source", text: ui.noSourceBody, sources: [] });
          currentLangRef.current = language;
          return;
        }
        data = {
          kind: "answer",
          text: hits[0].text,
          sources: hits.map((p) => ({ label: p.source.label, url: p.source.url })),
          language,
        };
      }
      setAnswer(normalize(data, language));
      currentLangRef.current = language;
    } finally {
      setBusy(false);
    }
  }

  function normalize(data: LearnResponse, language: Lang) {
    const ui = UI[language];
    if (data.kind === "safety") {
      return { kind: "safety" as const, text: data.text || ui.safetyBody, sources: [] };
    }
    if (data.kind === "no_source" || !data.text || !data.sources?.length) {
      return { kind: "no_source" as const, text: ui.noSourceBody, sources: [] };
    }
    return {
      kind: "answer" as const,
      text: data.text,
      sources: (data.sources ?? []).map((s) => ({ label: s.label, url: s.url })),
    };
  }

  async function askByVoice() {
    const transcript = await dictate({ prompt: t.askLabel });
    if (!transcript) {
      // Browser STT fallback when the voice service is unavailable.
      const t2 = await browserDictate();
      if (!t2) return;
      setQuestion(t2);
      askProgrammatically(t2);
      return;
    }
    setQuestion(transcript);
    askProgrammatically(transcript);
  }

  function browserDictate(): Promise<string | null> {
    return new Promise((resolve) => {
      const Constructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!Constructor) { resolve(null); return; }
      const rec = new Constructor();
      rec.lang = language === "fi" ? "fi-FI" : language === "sv" ? "sv-SE" : "en-GB";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let done = false;
      rec.onresult = (ev: any) => { if (!done) { done = true; resolve(ev.results[0][0].transcript); } };
      rec.onerror = () => { if (!done) { done = true; resolve(null); } };
      rec.onsoundend = () => { rec.stop(); };
      rec.start();
      setTimeout(() => { if (!done) { done = true; rec.abort(); resolve(null); } }, 8000);
    });
  }

  function speakAnswer() {
    if (!answer) return;
    const { speechSynthesis } = window;
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(answer.text);
    utter.lang = language === "fi" ? "fi-FI" : language === "sv" ? "sv-SE" : "en-GB";
    utter.rate = 0.95;
    utter.onend = () => { speakRef.current = null; };
    speakRef.current = () => { speechSynthesis.cancel(); speakRef.current = null; };
    speechSynthesis.speak(utter);
  }

  useEffect(() => {
    currentLangRef.current = language;
  }, [language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askProgrammatically(question);
  };

  return (
    <section aria-label="Learn" className="learn-screen">
      <h1>{t.title}</h1>
      <p className="sub">{t.subtitle}</p>

      <div className="learn-lang">
        <label htmlFor="learn-lang">{t.language}</label>
        <div role="group" aria-label={t.language} id="learn-lang">
          <button
            data-lang="en"
            className={language === "en" ? "on" : ""}
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            {t.english}
          </button>
          <button
            data-lang="fi"
            className={language === "fi" ? "on" : ""}
            aria-pressed={language === "fi"}
            onClick={() => setLanguage("fi")}
          >
            {t.selkosuomi}
          </button>
          <button
            data-lang="sv"
            className={language === "sv" ? "on" : ""}
            aria-pressed={language === "sv"}
            onClick={() => setLanguage("sv")}
          >
            {t.svenska}
          </button>
        </div>
      </div>

      <div className="learn-suggested">
        <h3>{t.suggested}</h3>
        <div className="chips">
          {suggested.map((q) => (
            <button key={q} type="button" onClick={() => askSuggested(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="learn-ask">
        <label htmlFor="learn-question">{t.askLabel}</label>
        <div className="input-row">
          <input
            ref={inputRef}
            id="learn-question"
            type="text"
            placeholder={t.askPlaceholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="primary" disabled={busy}>
            {t.askButton}
          </button>
          <button type="button" className="ghost" onClick={askByVoice} disabled={busy}>
            {t.dictatedLabel}
          </button>
        </div>
      </form>

      {answer && (
        <article
          ref={answerRef}
          className={`answer-card ${answer.kind}`}
          aria-labelledby="answer-heading"
        >
          <h2 id="answer-heading">{t.answer}</h2>
          {answer.kind === "safety" ? (
            <>
              <p className="priority">{t.safety}</p>
              <p>{answer.text}</p>
              <div className="learn-actions">
                <a href="tel:112" className="chip call">{t.call112}</a>
                <a href="tel:116117" className="chip call">{t.call116117}</a>
              </div>
            </>
          ) : answer.kind === "no_source" ? (
            <>
              <p>{answer.text}</p>
              <div className="learn-actions">
                <a href={`tel:${NURSE.phone}`} className="chip call">{t.callNurse}</a>
                <a href={`sms:${NURSE.phone}`} className="chip msg">{t.messageNurse}</a>
              </div>
            </>
          ) : (
            <>
              <p>{answer.text}</p>
              {answer.sources.length > 0 && (
                <div className="learn-sources">
                  <strong>{t.sources}</strong>
                  <ul>
                    {answer.sources.map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="note">{t.notEmergency}</p>
              <div className="learn-actions">
                <button type="button" onClick={speakAnswer} disabled={busy}>
                  {t.readAloud}
                </button>
                <button type="button" onClick={() => setAnswer(null)} disabled={busy}>
                  {t.clear}
                </button>
              </div>
            </>
          )}
        </article>
      )}
    </section>
  );
}
