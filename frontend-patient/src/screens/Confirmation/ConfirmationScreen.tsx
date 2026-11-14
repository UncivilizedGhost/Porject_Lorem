// Owner: person 2 — design port of app/confirm.html (artboard "5 · Alarm-style confirmation").
// The dark screen, the appointment facts, the escalation note and the slide. POST
// /escalation-steps/{id}/confirm with actorFields(). Voice replaces the slide with a read-back.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { Icon } from "../../components/Icon";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { formatClock, formatDate, formatWeekday } from "../../lib/format";
import { useI18n } from "../../i18n/LanguageProvider";
import { actorFields, getSession } from "../../lib/session";
import { useNextStepView } from "../../lib/usePatient";
import { useTonePage } from "../../shell/PageTone";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

export function ConfirmationScreen() {
  const { stepId = "" } = useParams();
  const { language, t } = useI18n();
  const isTrusted = getSession()?.role === "trusted_person";
  const next = useNextStepView()?.next_step ?? null;
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  useTonePage("dark");

  const confirm = async () => {
    try {
      await api.confirm(stepId, actorFields());
      setFailed(false);
      setDone(true);
    } catch {
      setFailed(true);
    }
  };

  const when = next
    ? `${formatWeekday(next.date, language)} ${formatDate(next.date)} at ${formatClock(next.time)}`
    : "";
  const readable = useMemo(
    () => ({
      heading: next ? t("confirm.heading", { what: next.what }) : t("confirm.doneTitle"),
      body: next ? `${when}, ${next.where}` : "",
    }),
    [next, when, t],
  );
  useReadable(readable);
  const actions = useMemo(
    () => [
      {
        id: "confirm:appointment",
        label: "Confirm",
        synonyms: ["yes confirm", "I confirm"],
        confirm_text: next ? `Confirm the ${next.what} on ${when}?` : "Confirm?",
        run: confirm,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [next, when, stepId],
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
  if (!next) return <p>{t("common.loading")}</p>;

  return (
    <section className="confirm-page">
      <div className="confirm-meta">
        <span className="confirm-eyebrow">{t("confirm.eyebrow")}</span>
        <h1>{next.what}</h1>
        <span className="confirm-when">{when}</span>
        <span className="confirm-where">{next.where}</span>
      </div>

      <p className="confirm-note">{t("confirm.note")}</p>

      <div className="confirm-actions">
        {failed && <p role="alert">{t("confirm.failed")}</p>}
        <SlideToConfirm label={next.what} onConfirm={confirm} />
        <div className="confirm-row">
          <Link className="confirm-secondary" to="/help">{t("confirm.newTime")}</Link>
          <a className="confirm-secondary" href={`tel:${NURSE_PHONE}`}>{t("home.callTitle")}</a>
        </div>
      </div>
    </section>
  );
}
