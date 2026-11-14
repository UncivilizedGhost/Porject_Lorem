// Owner: person 2 — design port of app/report-sent.html (artboard "R6 · Sent").
// The check mark, what was sent, the "getting worse" card with a way to the help numbers, and one
// big Home button. Green advice stays as a quiet card of its own.
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

const readable = { heading: "Sent to Nurse Aino", body: "A nurse replies within 1–2 working days." };

function CheckIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function R6Sent({ advice, symptoms, labels }: Props) {
  useReadable(readable);
  const names = symptoms.map((s) => labels[s] ?? s).join(", ") || "how you feel";

  return (
    <section className="sent">
      <span className="sent-check"><CheckIcon /></span>
      <h1>Sent to Nurse Aino</h1>

      <div className="sent-card">
        <span className="sent-title">{names}</span>
        <span className="sent-sub">A nurse reads your answers and replies within 1–2 working days.</span>
      </div>

      {advice === "self_care" && (
        <div className="sent-card">
          <span className="sent-title">Meanwhile</span>
          <ul className="sent-list">
            {symptoms.map((s) => (
              <li key={s}>{SELF_CARE[s] ?? SELF_CARE.other}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sent-amber">
        <span className="sent-amber-title">Getting worse? Call 116 117. Emergency: 112.</span>
        <Link className="dark-button" to="/help">Who to call</Link>
      </div>

      <Link className="sent-home" to="/home">Home</Link>
    </section>
  );
}
