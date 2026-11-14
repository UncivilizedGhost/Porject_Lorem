// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "5 · Alarm-style confirmation")
// SlideToConfirm for appointment / safety check / time-critical medicine →
// POST /escalation-steps/{id}/confirm with actorFields(). Voice replaces the slide: one action
// with a read-back sentence.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../api/client";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { formatClock, formatDate } from "../../lib/format";
import { actorFields, getSession } from "../../lib/session";
import { useNextStepView } from "../../lib/usePatient";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

export function ConfirmationScreen() {
  const { stepId = "" } = useParams();
  const isTrusted = getSession()?.role === "trusted_person";
  const next = useNextStepView()?.next_step ?? null;
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirm = async () => {
    try {
      await api.confirm(stepId, actorFields());
      setFailed(false);
      setDone(true);
    } catch {
      setFailed(true);
    }
  };

  const when = next ? `${formatDate(next.date)} at ${formatClock(next.time)}` : "";
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
      <section>
        <h1>Confirmed</h1>
        <p>Thank you. There will be no more reminders or calls about this step.</p>
        <Link className="primary" to={isTrusted ? "/trusted" : "/home"}>Done</Link>
      </section>
    );
  }
  if (!next) return <p>Loading…</p>;
  return (
    <section>
      <h1>Confirm your {next.what}</h1>
      <div className="card">
        <p><strong>{formatDate(next.date)}</strong> at <strong>{formatClock(next.time)}</strong></p>
        <p>{next.where}</p>
      </div>
      {failed && <p role="alert">We could not confirm this just now. Please try again.</p>}
      <SlideToConfirm label={next.what} onConfirm={confirm} />
    </section>
  );
}
