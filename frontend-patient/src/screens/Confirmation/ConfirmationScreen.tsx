// Owner: person 2 — design port of app/confirm.html (artboard "5 · Alarm-style confirmation").
// The dark screen, the appointment facts, the escalation note and the slide. POST
// /escalation-steps/{id}/confirm with actorFields(). Voice replaces the slide with a read-back.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { formatClock, formatDate, formatWeekday } from "../../lib/format";
import { actorFields, getSession } from "../../lib/session";
import { useNextStepView } from "../../lib/usePatient";
import { useTonePage } from "../../shell/PageTone";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

function CheckIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ConfirmationScreen() {
  const { stepId = "" } = useParams();
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

  const when = next ? `${formatWeekday(next.date)} ${formatDate(next.date)} at ${formatClock(next.time)}` : "";
  const readable = useMemo(
    () => ({ heading: next ? `Confirm your ${next.what}` : "Confirm", body: next ? `${when}, ${next.where}` : "" }),
    [next, when],
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
        <span className="sent-check"><CheckIcon /></span>
        <h1>Confirmed</h1>
        <div className="confirm-note">
          Thank you. There will be no more reminders or calls about this step.
        </div>
        <Link className="sent-home" to={isTrusted ? "/trusted" : "/home"}>Done</Link>
      </section>
    );
  }
  if (!next) return <p>Loading…</p>;

  return (
    <section className="confirm-page">
      <div className="confirm-meta">
        <span className="confirm-eyebrow">Please confirm you can come</span>
        <h1>{next.what}</h1>
        <span className="confirm-when">{when}</span>
        <span className="confirm-where">{next.where}</span>
      </div>

      <p className="confirm-note">
        If we don't hear from you, an automated call comes on day 2 and Nurse Aino calls on day 3.
      </p>

      <div className="confirm-actions">
        {failed && <p role="alert">We could not confirm this just now. Please try again.</p>}
        <SlideToConfirm label={next.what} onConfirm={confirm} />
        <div className="confirm-row">
          <Link className="confirm-secondary" to="/help">I need a new time</Link>
          <a className="confirm-secondary" href={`tel:${NURSE_PHONE}`}>Call Nurse Aino</a>
        </div>
      </div>
    </section>
  );
}
