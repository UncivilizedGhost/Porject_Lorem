// Owner: person 2 — the help numbers in spec order, reused on Help, the Check-in red screen,
// R2 Call now and the care-plan card. The HUS Cancer Center is never listed as an urgent line.
import { Link } from "react-router-dom";

/** Demo number for the named nurse; real numbers come from the coordinator record later. */
export const NURSE_PHONE = "+358400000000";

export function HelpNumbers() {
  return (
    <ol className="help-numbers">
      <li>
        <a className="call-button emergency" href="tel:112">Call 112</a>
        <span> In an emergency.</span>
      </li>
      <li>
        <a className="call-button" href="tel:116117">Call 116 117</a>
        <span> If you suddenly feel much worse, day or night (Päivystysapu). During treatment, 38 °C or more means the emergency department.</span>
      </li>
      <li>
        <a className="call-button" href={`tel:${NURSE_PHONE}`}>Call Nurse Aino</a>
        <span> Weekdays 8–16, for questions about your pathway.</span>
      </li>
      <li>
        <Link className="call-button" to="/report">Report a symptom</Link>
        <span> Anything that is not urgent. A nurse replies within 1–2 working days.</span>
      </li>
    </ol>
  );
}
