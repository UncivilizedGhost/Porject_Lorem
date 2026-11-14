// Owner: person 2 — design port of app/timeline.html (artboard "4 · Pathway timeline").
// The 6-week goal line and pathway_steps (done / next / later) from GET /patients/{id}, drawn as
// the artboard's marker rail: teal checks for done, a thick ring for next, a thin grey ring for
// later, and the next step's card in pale teal. App copy follows the page language; step names
// come from the server.
import { useMemo, useRef } from "react";

import { NoPathwayYet } from "../../components/NoPathwayYet";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { formatDate, formatWeekday } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";

export function PathwayScreen() {
  const patient = usePatient();
  const { language, t } = useI18n();
  const readable = useMemo(
    () => ({ heading: t("pathway.title"), body: t("pathway.goal") }),
    [t],
  );
  useReadable(readable);

  // "Go to the current step": scrolls the next step into view (the frame scrolls, not the page)
  // and focuses its card, so keyboard and screen-reader users land on it too.
  const nextCard = useRef<HTMLDivElement>(null);
  const jumpToCurrent = () => {
    const card = nextCard.current;
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.focus({ preventScroll: true });
  };

  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>{t("common.loading")}</p>;

  const steps = patient.pathway_steps;
  const done = steps.filter((s) => s.state === "done").length;
  const next = steps.find((s) => s.state === "next");
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const week = next ? Math.max(1, Math.ceil(next.expected_day / 7)) : 1;

  return (
    <section className="pathway">
      <h1>{t("pathway.title")}</h1>

      {next && (
        <button type="button" className="jump-next" onClick={jumpToCurrent}>
          <Icon name="chevron-down" size={16} />
          {t("pathway.jump")}
        </button>
      )}

      <div className="goal-card">
        <span className="goal-bar" aria-hidden="true">
          <span className="goal-fill" style={{ width: `${percent}%` }} />
        </span>
        <div className="goal-row">
          <span>{t("pathway.week", { n: week })}</span>
          <span>{next ? t("pathway.by", { date: formatDate(next.date) }) : t("pathway.allDone")}</span>
        </div>
      </div>

      <ol className="path">
        {steps.map((s) => (
          <li key={s.id} className={`path-item ${s.state}`}>
            <span className="path-rail" aria-hidden="true">
              <span className="path-marker">{s.state === "done" ? <Icon name="check" size={12} /> : null}</span>
              <span className="path-line" />
            </span>
            <div className="path-body">
              <div
                className="path-card"
                ref={s.state === "next" ? nextCard : undefined}
                tabIndex={s.state === "next" ? -1 : undefined}
              >
                {s.state === "next" && <span className="chip-next">{t("pathway.next")}</span>}
                {s.state !== "next" && <span className="sr-only">{t(`pathway.state.${s.state}`)}. </span>}
                <span className="path-title">{s.label}</span>
                <span className="path-meta">
                  {s.date_is_estimate
                    ? t("pathway.usually", { date: formatDate(s.date) })
                    : `${formatWeekday(s.date, language)} ${formatDate(s.date)}`}
                </span>
                {s.location && <span className="path-meta">{s.location}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="screen-sub">{t("pathway.goal")}</p>
    </section>
  );
}
