// Owner: person 2 — the help numbers in spec order, reused on Help, the Check-in red screen,
// R2 Call now and the care-plan card. The HUS Cancer Center is never listed as an urgent line.
import { Link } from "react-router-dom";

/** Demo number for the named nurse; real numbers come from the coordinator record later. */
export const NURSE_PHONE = "+358400000000";

export function HelpNumbers() {
  return (
    <ol className="help-numbers">
      <li>
        <div className="help-item">
          <a className="call-button emergency" href="tel:112">
            <span className="call-button-title">Call 112</span>
          </a>
          <span className="call-button-desc">In an emergency.</span>
        </div>
      </li>
      <li>
        <div className="help-item">
          <a className="call-button urgent" href="tel:116117">
            <span className="call-button-title">Call 116 117</span>
          </a>
          <span className="call-button-desc">
            If you suddenly feel much worse, day or night (Päivystysapu). During treatment, 38 °C or
            more means the emergency department.
          </span>
        </div>
      </li>
      <li>
        <div className="help-item">
          <a className="call-button nurse" href={`tel:${NURSE_PHONE}`}>
            <span className="call-button-title">Tell Nurse Aino</span>
          </a>
          <span className="call-button-desc">Weekdays 8–16, for questions about your pathway.</span>
        </div>
      </li>
      <li>
        <div className="help-item">
          <Link className="call-button report" to="/report">
            <span className="call-button-title">Report a symptom</span>
          </Link>
          <span className="call-button-desc">
            Anything that is not urgent. A nurse replies within 1–2 working days.
          </span>
        </div>
      </li>
    </ol>
  );
}
