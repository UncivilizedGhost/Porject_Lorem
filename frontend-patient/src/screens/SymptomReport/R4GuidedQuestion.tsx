// Owner: person 2 — design port of app/report-question.html (artboard "R4 · Guided questions").
// One question per screen from GET /rules: the symptom name, a progress bar, the question as a
// fieldset legend, the options as 124 px tiles with an icon and a check ring, then one big Next.
// Option tiles are chosen first and confirmed with Next, as in the artboard; a spoken answer still
// counts straight away. Never grades.
import { useMemo, useState } from "react";

import type { Question } from "../../api/types";
import { NumberPad, parseNumber } from "../../components/NumberPad";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { useVoice } from "../../voice/VoiceProvider";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

/* Lucide icon names for the option tiles. */
type OptionIconName =
  | "opt-yes" | "opt-no" | "opt-stairs" | "opt-light-effort" | "opt-at-rest" | "opt-none"
  | "opt-streaks" | "opt-more-than-streaks" | "opt-mild" | "opt-moderate" | "opt-severe"
  | "opt-very-severe" | "opt-well" | "opt-unwell" | "opt-managing" | "opt-cant-usual"
  | "opt-in-bed" | "opt-normal" | "opt-less" | "opt-hardly" | "opt-not-at-all"
  | "opt-a-little" | "opt-somewhat" | "opt-quite-a-bit" | "opt-very-much";

const OPTION_ICONS: Record<string, OptionIconName> = {
  yes: "opt-yes",
  no: "opt-no",
  stairs: "opt-stairs",
  light_effort: "opt-light-effort",
  at_rest: "opt-at-rest",
  none: "opt-none",
  streaks: "opt-streaks",
  more_than_streaks: "opt-more-than-streaks",
  mild: "opt-mild",
  moderate: "opt-moderate",
  severe: "opt-severe",
  very_severe: "opt-very-severe",
  well: "opt-well",
  unwell: "opt-unwell",
  managing: "opt-managing",
  cant_usual: "opt-cant-usual",
  in_bed: "opt-in-bed",
  normal: "opt-normal",
  less: "opt-less",
  hardly: "opt-hardly",
  not_at_all: "opt-not-at-all",
  a_little: "opt-a-little",
  somewhat: "opt-somewhat",
  quite_a_bit: "opt-quite-a-bit",
  very_much: "opt-very-much",
};

export function OptionIcon({ id }: { id: string }) {
  return <Icon name={OPTION_ICONS[id] ?? "opt-none"} size={30} />;
}

export function CheckRing({ on }: { on: boolean }) {
  return <Icon name={on ? "check-circle" : "circle"} size={24} />;
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
  const { t } = useI18n();
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
          <span className="q-mic"><Icon name="mic" size={24} /></span>
          <span>{t("report.voiceHint")}</span>
        </p>
      )}

      <button type="button" className="q-next" disabled={!ready} onClick={submit}>
        {t("report.next")}
      </button>
    </section>
  );
}
