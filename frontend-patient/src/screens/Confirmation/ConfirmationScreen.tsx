// Owner: person 2 — design port of app/confirm.html (artboard "5 · Alarm-style confirmation").
// The dark screen, the appointment facts, the escalation note and the slide. POST
// /escalation-steps/{id}/confirm with actorFields(). Voice replaces the slide with a read-back.
// `alarm` is the demo trigger: the same screen with a deepening red shade and a rising tone.
// The demo patient has no appointment left after day 57, so the alarm falls back to the exact
// fixture in app/confirm.html instead of showing "Loading…".
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { Icon } from "../../components/Icon";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { formatClock, formatDate, formatWeekday } from "../../lib/format";
import { useI18n } from "../../i18n/LanguageProvider";
import { actorFields, getSession } from "../../lib/session";
import { startAlarm, stopAlarm } from "../../lib/alarmSound";
import { useNextStepView } from "../../lib/usePatient";
import { useTonePage } from "../../shell/PageTone";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

/** app/confirm.html's own appointment, used by the alarm when there is no live next step. */
const CONFIRM_SAMPLE = {
  what: "Chest CT scan",
  when: "Wednesday 18.11. at 9.30",
  where: "Jorvi Hospital, Espoo",
};

export function ConfirmationScreen({ alarm = false }: { alarm?: boolean }) {
  const { stepId: routeStepId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const isTrusted = getSession()?.role === "trusted_person";
  const next = useNextStepView()?.next_step ?? null;
  // The alarm page has no step id in its URL: it confirms the appointment that is waiting.
  const stepId = routeStepId ?? next?.pending_confirmation?.id ?? "";
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  useTonePage("dark");

  useEffect(() => {
    if (!alarm) return;
    startAlarm();
    return stopAlarm;
  }, [alarm]);

  const view = next
    ? {
        what: next.what,
        when: `${formatWeekday(next.date, language)} ${formatDate(next.date)} at ${formatClock(next.time)}`,
        where: next.where,
      }
    : alarm
      ? CONFIRM_SAMPLE
      : null;

  const confirm = async () => {
    if (!stepId) {
      // The confirm.html fixture has nothing to post: sliding it goes home, as in the artboard.
      if (alarm) {
        stopAlarm();
        navigate("/home");
      }
      return;
    }
    try {
      await api.confirm(stepId, actorFields());
      setFailed(false);
      setDone(true);
      if (alarm) stopAlarm();
    } catch {
      setFailed(true);
    }
  };

  const readable = useMemo(
    () => ({
      heading: view ? t("confirm.heading", { what: view.what }) : t("confirm.doneTitle"),
      body: view ? `${view.when}, ${view.where}` : "",
    }),
    [view, t],
  );
  useReadable(readable);
  const actions = useMemo(
    () => [
      {
        id: "confirm:appointment",
        label: "Confirm",
        synonyms: ["yes confirm", "I confirm"],
        confirm_text: view ? `Confirm the ${view.what} on ${view.when}?` : "Confirm?",
        run: confirm,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, stepId],
  );
  useVoiceActions(actions);

  if (done) {
    return (
      <section className="sent">
        <span className="sent-check"><Icon name="check" size={38} /></span>
        <h1>{t("confirm.doneTitle")}</h1>
        <div className="confirm-note">
          {t("confirm.doneBody")}
        </div>
        <Link className="sent-home" to={isTrusted ? "/trusted" : "/home"}>{t("confirm.done")}</Link>
      </section>
    );
  }
  if (!view) return <p>{t("common.loading")}</p>;

  return (
    <section className={alarm ? "confirm-page alarm-page" : "confirm-page"}>
      <div className="confirm-meta">
        <span className="confirm-eyebrow">{t("confirm.eyebrow")}</span>
        <h1>{view.what}</h1>
        <span className="confirm-when">{view.when}</span>
        <span className="confirm-where">{view.where}</span>
      </div>

      <p className="confirm-note">{t("confirm.note")}</p>

      <div className="confirm-actions">
        {failed && <p role="alert">{t("confirm.failed")}</p>}
        <SlideToConfirm label={view.what} onConfirm={confirm} />
        <div className="confirm-row">
          <Link className="confirm-secondary" to="/help">{t("confirm.newTime")}</Link>
          <a className="confirm-secondary" href={`tel:${NURSE_PHONE}`}>{t("home.callTitle")}</a>
        </div>
      </div>
    </section>
  );
}
