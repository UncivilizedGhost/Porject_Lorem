// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "7 · Symptom check-in (phase 3)")
// call_now → red "Call now" screen (116 117, 112, Nurse Aino told); otherwise a thank-you.
import { Link } from "react-router-dom";

import type { AdviceShown } from "../../api/types";
import { useReadable } from "../../voice/useReadable";
import { R2CallNow } from "../SymptomReport/R2CallNow";

const thanks = { heading: "Thank you", body: "Your check-in was sent to Nurse Aino." };

function Thanks() {
  useReadable(thanks);
  return (
    <section>
      <h1>Thank you</h1>
      <p>Your check-in was sent to Nurse Aino. Your next check-in is in about a week.</p>
      <Link className="primary" to="/home">Back to Home</Link>
    </section>
  );
}

export function CheckInResult({ advice }: { advice: AdviceShown }) {
  return advice === "call_now" ? <R2CallNow reason={null} /> : <Thanks />;
}
