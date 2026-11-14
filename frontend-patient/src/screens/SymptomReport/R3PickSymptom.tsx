// Owner: person 2 — design port of app/report-pick.html (artboard "R3 · Pick a symptom").
// "Report a symptom" eyebrow + one question, a full-width red "Very unwell right now" tile, then
// one tile per symptom from GET /rules in a two-column grid, each with the artboard's line icon,
// "Something else" in apricot, and the "pick the one that bothers you most" note.
// Icons come from @phosphor-icons/react.
import { useMemo } from "react";

import type { SymptomDef } from "../../api/types";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

/* Lucide icon names for symptom tiles, matched by symptom id or label keyword. */
const SYMPTOM_ICONS: Record<string, "symptom-breathlessness" | "symptom-cough" | "symptom-pain" | "symptom-fever" | "symptom-tired" | "symptom-other"> = {
  breathlessness: "symptom-breathlessness",
  cough: "symptom-cough",
  pain: "symptom-pain",
  fever_unwell: "symptom-fever",
  tired_appetite: "symptom-tired",
  other: "symptom-other",
};

const URGENT_ICON = "symptom-urgent";

/** The rules are server-owned, so match by id first and by label word second. */
function iconFor(symptom: SymptomDef): string {
  if (SYMPTOM_ICONS[symptom.id]) return SYMPTOM_ICONS[symptom.id];
  const label = symptom.label.toLowerCase();
  if (/breath/.test(label)) return "symptom-breathlessness";
  if (/cough|phlegm|blood/.test(label)) return "symptom-cough";
  if (/pain/.test(label)) return "symptom-pain";
  if (/fever|unwell/.test(label)) return "symptom-fever";
  if (/tired|appetite|eating/.test(label)) return "symptom-tired";
  if (/else/.test(label)) return "symptom-other";
  return "symptom-other";
}

function TileIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`pick-icon ${className}`.trim()} aria-hidden="true">
      <Icon name={name as any} size={30} className={className} />
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
  const { t } = useI18n();
  const heading = t("report.pickHeading");
  const note = t("report.pickNote");

  const readable = useMemo(() => ({ heading, body: note }), [heading, note]);
  useReadable(readable);

  // "Something else" is a client-side option: GET /rules lists the named symptoms, and the
  // report sends symptom "other" with rules.other_symptom_questions. Shown last, in apricot.
  const hasOther = symptoms.some((s) => s.id === "other" || /something else/i.test(s.label));

  const actions = useMemo(
    () => [
      { id: "pick:urgent", label: t("report.urgent"), run: onUrgent },
      ...symptoms.map((s) => ({ id: `pick:${s.id}`, label: s.label, run: () => onPick(s.id) })),
      ...(hasOther ? [] : [{ id: "pick:other", label: t("report.other"), run: () => onPick("other") }]),
    ],
    [symptoms, hasOther, onPick, onUrgent, t],
  );
  useVoiceActions(actions);

  return (
    <section className="report-pick">
      <div className="screen-heading">
        <span className="eyebrow">{t("report.eyebrow")}</span>
        <h1>{heading}</h1>
      </div>

      <div className="pick-grid">
        <button type="button" className="pick-tile wide urgent" onClick={onUrgent}>
          <TileIcon name={URGENT_ICON} />
          <span className="pick-title">{t("report.urgent")}</span>
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
              <TileIcon name={iconFor(s)} />
              <span className="pick-title">{s.label}</span>
            </button>
          );
        })}

        {!hasOther && (
          <button type="button" className="pick-tile apricot" onClick={() => onPick("other")}>
            <TileIcon name="symptom-other" />
            <span className="pick-title">{t("report.other")}</span>
          </button>
        )}
      </div>

      <p className="pick-note">{note}</p>
    </section>
  );
}
