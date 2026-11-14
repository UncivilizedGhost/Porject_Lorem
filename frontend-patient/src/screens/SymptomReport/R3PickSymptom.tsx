// Owner: person 2 — design port of app/report-pick.html (artboard "R3 · Pick a symptom").
// "Report a symptom" eyebrow + one question, a full-width red "Very unwell right now" tile, then
// one tile per symptom from GET /rules in a two-column grid, each with the artboard's line icon,
// "Something else" in apricot, and the "pick the one that bothers you most" note.
// The artboard has no image files: every picture here is inline SVG.
import { useMemo } from "react";
import type { ReactNode } from "react";

import type { SymptomDef } from "../../api/types";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

/* Paths copied from report-pick.html, drawn on a 30 × 30 grid. */
const ICONS: Record<string, ReactNode> = {
  breathlessness: <path d="M4 11h13a3 3 0 10-3-3M4 16h18a3 3 0 11-3 3M4 21h8" />,
  cough: <path d="M8 7c-3 2-4 5-4 8s2 7 6 7h1M22 7c3 2 4 5 4 8s-2 7-6 7h-1M15 4v11M15 15l-4 4M15 15l4 4" />,
  pain: <path d="M15 4l3 7 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />,
  fever_unwell: <path d="M13 5a3 3 0 016 0v11a5 5 0 11-6 0zM16 12v8" />,
  tired_appetite: <path d="M20 6a9 9 0 100 18 10 10 0 01-6-9 10 10 0 016-9z" />,
  other: <path d="M6 8h18M6 15h18M6 22h11" />,
};
const URGENT_ICON = <path d="M15 4l12 21H3zM15 12v6M15 22v.5" />;
const FALLBACK_ICON = <path d="M15 4a11 11 0 100 22 11 11 0 000-22zM15 10v8M15 21v.5" />;

/** The rules are server-owned, so match by id first and by label word second. */
function iconFor(symptom: SymptomDef): ReactNode {
  if (ICONS[symptom.id]) return ICONS[symptom.id];
  const label = symptom.label.toLowerCase();
  if (/breath/.test(label)) return ICONS.breathlessness;
  if (/cough|phlegm|blood/.test(label)) return ICONS.cough;
  if (/pain/.test(label)) return ICONS.pain;
  if (/fever|unwell/.test(label)) return ICONS.fever_unwell;
  if (/tired|appetite|eating/.test(label)) return ICONS.tired_appetite;
  if (/else/.test(label)) return ICONS.other;
  return FALLBACK_ICON;
}

function TileIcon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`pick-icon ${className}`.trim()} aria-hidden="true">
      <svg
        width="30" height="30" viewBox="0 0 30 30" focusable="false"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

interface Props {
  symptoms: SymptomDef[];
  onPick: (id: string) => void;
  /** The red tile: straight to the Call now screen, like a Safety Check tap. */
  onUrgent: () => void;
}

export function R3PickSymptom({ symptoms, onPick, onUrgent }: Props) {
  const heading = "What would you like to tell Nurse Aino about?";
  const note = "Pick the one that bothers you most. You can add more at the end.";

  const readable = useMemo(() => ({ heading, body: note }), []);
  useReadable(readable);

  // "Something else" is a client-side option: GET /rules lists the named symptoms, and the
  // report sends symptom "other" with rules.other_symptom_questions. Shown last, in apricot.
  const hasOther = symptoms.some((s) => s.id === "other" || /something else/i.test(s.label));

  const actions = useMemo(
    () => [
      { id: "pick:urgent", label: "Very unwell right now", run: onUrgent },
      ...symptoms.map((s) => ({ id: `pick:${s.id}`, label: s.label, run: () => onPick(s.id) })),
      ...(hasOther ? [] : [{ id: "pick:other", label: "Something else", run: () => onPick("other") }]),
    ],
    [symptoms, hasOther, onPick, onUrgent],
  );
  useVoiceActions(actions);

  return (
    <section className="report-pick">
      <div className="screen-heading">
        <span className="eyebrow">Report a symptom</span>
        <h1>{heading}</h1>
      </div>

      <div className="pick-grid">
        <button type="button" className="pick-tile wide urgent" onClick={onUrgent}>
          <TileIcon>{URGENT_ICON}</TileIcon>
          <span className="pick-title">Very unwell right now</span>
        </button>

        {symptoms.map((s) => {
          const other = s.id === "other" || /something else/i.test(s.label);
          return (
            <button
              key={s.id}
              type="button"
              className={`pick-tile${other ? " apricot" : ""}`}
              onClick={() => onPick(s.id)}
            >
              <TileIcon>{iconFor(s)}</TileIcon>
              <span className="pick-title">{s.label}</span>
            </button>
          );
        })}

        {!hasOther && (
          <button type="button" className="pick-tile apricot" onClick={() => onPick("other")}>
            <TileIcon>{ICONS.other}</TileIcon>
            <span className="pick-title">Something else</span>
          </button>
        )}
      </div>

      <p className="pick-note">{note}</p>
    </section>
  );
}
