// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R2 · Call now")
// Names the item or symptom that triggered it, big 112 and 116 117 buttons, says Nurse Aino
// was also told. Priority readable.
import { useMemo } from "react";

import { useReadable } from "../../voice/useReadable";

export function R2CallNow({ reason }: { reason: string | null }) {
  const readable = useMemo(
    () => ({
      heading: "Call now",
      priority: `Call now. ${reason ? `You told us: ${reason}. ` : ""}Phone 112 in an emergency, or 116 117 if you suddenly feel much worse.`,
    }),
    [reason],
  );
  useReadable(readable);
  return (
    <section className="call-now">
      <h1>Call now</h1>
      {reason && <p>You told us: <strong>{reason}</strong></p>}
      <p>Do not wait for a reply. Phone for help yourself.</p>
      <a className="call-button emergency" href="tel:112">Call 112 (emergency)</a>
      <a className="call-button" href="tel:116117">Call 116 117 (urgent advice)</a>
      <p>Nurse Aino was told too.</p>
    </section>
  );
}
