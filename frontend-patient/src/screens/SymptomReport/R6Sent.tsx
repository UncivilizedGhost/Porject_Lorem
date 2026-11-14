// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R6 · Sent (yellow / green)")
// What was sent, reply within 1–2 working days, when to phone instead of waiting; green →
// short self-care advice for the symptom.
import { Link } from "react-router-dom";

import type { AdviceShown } from "../../api/types";
import { useReadable } from "../../voice/useReadable";

const SELF_CARE: Record<string, string> = {
  breathlessness: "Sit upright and rest. Slow, relaxed breaths help.",
  cough: "Sip warm drinks and rest your voice.",
  pain: "Rest, and take your usual pain relief as your nurse has advised.",
  fever_unwell: "Drink plenty of fluids and rest.",
  tired_appetite: "Eat small meals often, and rest when you need to.",
  other: "Rest and keep a note of how it changes.",
};

interface Props {
  advice: Exclude<AdviceShown, "call_now">;
  symptoms: string[];
  labels: Record<string, string>;
}

const readable = { heading: "Sent", body: "A nurse replies within 1–2 working days." };

export function R6Sent({ advice, symptoms, labels }: Props) {
  useReadable(readable);
  return (
    <section>
      <h1>Sent</h1>
      <p>We sent your report about: {symptoms.map((s) => labels[s] ?? s).join(", ") || "how you feel"}.</p>
      <p>A nurse replies within 1–2 working days.</p>
      {advice === "self_care" && (
        <div className="card">
          <h2>Meanwhile</h2>
          <ul>
            {symptoms.map((s) => (
              <li key={s}>{SELF_CARE[s] ?? SELF_CARE.other}</li>
            ))}
          </ul>
        </div>
      )}
      <p>If it gets worse, do not wait: phone 116 117, or 112 in an emergency.</p>
      <Link className="primary" to="/home">Back to Home</Link>
    </section>
  );
}
