// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "2 · Warning signs (phase 1)")
// Signs from GET /rules warning_signs, one-tap "I have this" → POST /contacts/{id}/warning-sign-tap;
// shows what happens next ("a nurse calls within 1–2 working days", or "seek care today").
import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Option } from "../../api/types";
import { actorFields, getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

type Outcome = { sign: string; grade: string } | null;

export function WarningSignsScreen() {
  const [signs, setSigns] = useState<Option[]>();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState(false);
  const contactId = getSession()?.contactId ?? "";

  useEffect(() => {
    api.rules().then((r) => setSigns(r.warning_signs)).catch(() => setError(true));
  }, []);

  const tap = useMemo(
    () => async (sign: Option) => {
      try {
        const res = await api.warningSignTap(contactId, { symptom: sign.id, ...actorFields() });
        setError(false);
        setOutcome({ sign: sign.id, grade: res.grade });
      } catch {
        setError(true);
      }
    },
    [contactId],
  );

  const readable = useMemo(
    () => ({
      heading: "Signs to watch for",
      body: "If you notice one of these, tap I have this and a nurse will call you.",
      priority: outcome?.grade === "red" ? "Seek care today. Call 112 or 116 117." : undefined,
    }),
    [outcome],
  );
  useReadable(readable);
  const actions = useMemo(
    () => (signs ?? []).map((s) => ({ id: `sign:${s.id}`, label: `I have this: ${s.label}`, run: () => tap(s) })),
    [signs, tap],
  );
  useVoiceActions(actions);

  if (!signs) return error ? <p role="alert">We could not load the list. Please try again.</p> : <p>Loading…</p>;
  return (
    <section>
      <h1>Signs to watch for</h1>
      <p>If you notice one of these, tap “I have this”. You do not need to explain.</p>
      <ul className="warning-signs">
        {signs.map((s) => (
          <li key={s.id}>
            <span>{s.label}</span>
            <button type="button" onClick={() => tap(s)}>I have this</button>
          </li>
        ))}
      </ul>
      {error && <p role="alert">We could not send that. Please try again.</p>}
      {outcome?.grade === "red" ? (
        <div className="card urgent" role="alert">
          <h2>Seek care today</h2>
          <p>Do not wait for a call. Phone now.</p>
          <a className="call-button emergency" href="tel:112">Call 112</a>
          <a className="call-button" href="tel:116117">Call 116 117</a>
        </div>
      ) : (
        outcome && <p role="status">Thank you. A nurse will call you within 1–2 working days.</p>
      )}
    </section>
  );
}
