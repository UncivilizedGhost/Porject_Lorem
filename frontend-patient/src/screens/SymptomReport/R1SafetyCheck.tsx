// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R1 · Safety check first")
// The 7 "right now?" items as buttons + "None of these" primary; always-visible notice.
// Any item → R2 in one tap.
import { useMemo } from "react";

import type { Option } from "../../api/types";
import { useI18n } from "../../i18n/LanguageProvider";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

interface Props {
  items: Option[];
  onTick: (item: Option) => void;
  onNone: () => void;
}

export function R1SafetyCheck({ items, onTick, onNone }: Props) {
  const { t } = useI18n();
  const readable = useMemo(
    () => ({
      heading: t("report.r1Heading"),
      body: t("report.r1Body"),
      priority: t("report.r1Notice"),
    }),
    [t],
  );
  useReadable(readable);
  const actions = useMemo(
    () => [
      { id: "safety:none", label: t("report.none"), synonyms: ["no", "nothing"], run: onNone },
      ...items.map((i) => ({ id: `safety:${i.id}`, label: i.label, run: () => onTick(i) })),
    ],
    [items, onTick, onNone, t],
  );
  useVoiceActions(actions);

  return (
    <section className="report-q">
      <div className="screen-heading">
        <span className="eyebrow">{t("report.eyebrow")}</span>
        <h1>{t("report.r1Heading")}</h1>
      </div>
      <p className="notice" role="note">
        {t("report.r1Notice")}
      </p>
      <div role="group" aria-label="Right now" className="choice-list">
        {items.map((i) => (
          <button key={i.id} type="button" onClick={() => onTick(i)}>{i.label}</button>
        ))}
      </div>
      <button type="button" className="primary" onClick={onNone}>{t("report.none")}</button>
    </section>
  );
}
