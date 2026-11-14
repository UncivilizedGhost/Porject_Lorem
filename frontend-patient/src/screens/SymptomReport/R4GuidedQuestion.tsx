// Owner: person 2 — design port of app/report-question.html (artboard "R4 · Guided questions").
// One question per screen from GET /rules: the symptom name, a progress bar, the question as a
// fieldset legend, the options as 124 px tiles with an icon and a check ring, then one big Next.
// Option tiles are chosen first and confirmed with Next, as in the artboard; a spoken answer still
// counts straight away. Never grades.
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Question } from "../../api/types";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { useVoice } from "../../voice/VoiceProvider";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

/* Line icons for the option tiles, drawn on the artboard's 30 × 30 grid. The rules are
   server-owned, so ids are matched when they are known and a neutral mark is used otherwise. */
const OPTION_ICONS: Record<string, ReactNode> = {
  yes: <path d="M6 16l6 6 12-14" />,
  no: <path d="M7 15h16" />,
  stairs: <path d="M4 25h6v-6h6v-6h6V7h4" />,
  light_effort: <path d="M13 4a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM14 10l-1 7 4 2-1 6M13 17l-4 4-1 4M14 12l5 3" />,
  at_rest: <path d="M8 20v-8h14v8M6 20h18v4H6zM9 24v2M21 24v2" />,
  none: <path d="M15 6a9 9 0 100 18 9 9 0 000-18z" />,
  streaks: <path d="M15 5c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z" />,
  more_than_streaks: <path d="M11 8c2.5 3 4 5 4 7a4 4 0 11-8 0c0-2 1.5-4 4-7zM21 12c2.5 3 4 5 4 7a4 4 0 11-8 0c0-2 1.5-4 4-7z" />,
  mild: <path d="M10 24v-6" />,
  moderate: <path d="M10 24v-6M17 24v-11" />,
  severe: <path d="M10 24v-6M17 24v-11M24 24v-16" />,
  very_severe: <path d="M7 24v-6M13 24v-11M19 24v-16M25 24v-20" />,
  well: <path d="M15 9a6 6 0 100 12 6 6 0 000-12zM15 3v2M15 25v2M3 15h2M25 15h2" />,
  unwell: <path d="M9 19h12a4 4 0 000-8 6 6 0 00-11-1 5 5 0 00-1 9zM10 23l-1 3M15 23l-1 3M20 23l-1 3" />,
  managing: <path d="M6 11l4 4 8-9M6 21h14" />,
  cant_usual: <path d="M15 5a10 10 0 100 20 10 10 0 000-20zM8 8l14 14" />,
  in_bed: <path d="M4 22v-7h20a2 2 0 012 2v5M4 22h26M8 15V9h7a4 4 0 014 4v2" />,
  normal: <path d="M15 6a9 9 0 100 18 9 9 0 000-18zM10 15h10" />,
  less: <path d="M15 6a9 9 0 100 18 9 9 0 000-18zM11 15h8M15 11v0" />,
  hardly: <path d="M15 6a9 9 0 100 18 9 9 0 000-18zM12 15h6" />,
  not_at_all: <path d="M7 15h16" />,
  a_little: <path d="M12 23v-5M18 23v-5" />,
  somewhat: <path d="M9 23v-7M15 23v-7M21 23v-7" />,
  quite_a_bit: <path d="M9 23v-11M15 23v-11M21 23v-11" />,
  very_much: <path d="M8 23v-16M15 23v-16M22 23v-16" />,
};
const FALLBACK_ICON = <path d="M15 6a9 9 0 100 18 9 9 0 000-18zM15 15v.01" />;

export function OptionIcon({ id }: { id: string }) {
  return (
    <svg
      width="30" height="30" viewBox="0 0 30 30" focusable="false" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      {OPTION_ICONS[id] ?? FALLBACK_ICON}
    </svg>
  );
}

export function CheckRing({ on }: { on: boolean }) {
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

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  question: Question;
  /** The symptom being reported, shown above the progress bar. */
  label: string;
  /** 1-based: "2 of 3". */
  index: number;
  total: number;
  onAnswer: (value: string | number) => void;
}

export function R4GuidedQuestion({ question, label, index, total, onAnswer }: Props) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState("");
  const { settings } = useVoice();
  const choices = useMemo(() => question.options ?? [], [question.options]);
  const readable = useMemo(() => ({ heading: question.prompt }), [question.prompt]);
  useReadable(readable);

  const actions = useMemo(
    () => [
      ...choices.map((c) => ({ id: `choice:${c.id}`, label: c.label, run: () => onAnswer(c.id) })),
      ...(question.kind === "number"
        ? [{ id: "number:answer", label: "Answer", kind: "number" as const, run: (n?: number) => { if (n !== undefined) onAnswer(n); } }]
        : []),
    ],
    [choices, question.kind, onAnswer],
  );
  useVoiceActions(actions);

  const ready = question.kind === "choice" ? selected !== "" : value !== "";
  const submit = () => {
    if (!ready) return;
    onAnswer(question.kind === "choice" ? selected : parseNumber(value));
  };
  const percent = total > 0 ? Math.round((Math.min(index, total) / total) * 100) : 0;

  return (
    <section className="report-q">
      <div className="q-head">
        <span className="q-label">{label}</span>
        <div className="q-progress">
          <span className="q-bar"><span className="q-bar-fill" style={{ width: `${percent}%` }} /></span>
          <span className="q-count">{index} of {total}</span>
        </div>
      </div>

      <fieldset className="q-field">
        <legend className="q-prompt">{question.prompt}</legend>
        {question.kind === "choice" ? (
          <div className="q-options">
            {choices.map((c) => (
              <label key={c.id} className="q-opt" data-selected={selected === c.id}>
                <input
                  type="radio"
                  name={question.id}
                  value={c.id}
                  checked={selected === c.id}
                  onChange={() => setSelected(c.id)}
                />
                <span className="q-opt-icons">
                  <span className="q-opt-icon"><OptionIcon id={c.id} /></span>
                  <span className="q-check"><CheckRing on={selected === c.id} /></span>
                </span>
                <span className="q-opt-label">{c.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <NumberPad value={value} onChange={setValue} allowDecimal label={question.unit ?? "Your answer"} />
        )}
      </fieldset>

      {settings.voice_mode && (
        <p className="q-voice">
          <span className="q-mic"><MicIcon /></span>
          <span>Or hold and say your answer. We read it back before saving.</span>
        </p>
      )}

      <button type="button" className="q-next" disabled={!ready} onClick={submit}>
        Next
      </button>
    </section>
  );
}
