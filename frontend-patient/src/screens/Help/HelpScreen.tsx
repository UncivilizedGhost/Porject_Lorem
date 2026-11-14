// Owner: person 2 — design port of app/help.html (artboard "12 · Who to call").
// Ranked cards: 112 (red), 116 117 (dark), Tell Nurse Aino (white → the report flow), and the
// "if you are not sure" footnote. The HUS Cancer Center is never listed as an urgent line.
import { Link } from "react-router-dom";

import { useReadable } from "../../voice/useReadable";

const readable = {
  heading: "Who to call",
  priority: "In an emergency call 112. If you suddenly feel much worse, call 116 117.",
};

export function HelpScreen() {
  useReadable(readable);
  return (
    <section className="help-screen">
      <div className="help-heading">
        <h1 className="help-title">Who to call</h1>
        <p className="help-sub">Pick the one that matches how you feel right now.</p>
      </div>

      <a className="help-call emergency" href="tel:112">
        <span className="help-call-title">Call 112</span>
        <span className="help-call-sub">Emergency: chest pain, heavy bleeding, struggling to breathe</span>
      </a>

      <a className="help-call urgent" href="tel:116117">
        <span className="help-call-title">Call 116 117</span>
        <span className="help-call-sub">Medical helpline: fever, pain, or symptoms getting worse</span>
      </a>

      <Link className="help-call nurse" to="/report">
        <span className="help-call-title">Tell Nurse Aino</span>
        <span className="help-call-sub">Weekdays 8–16 · she calls you back</span>
      </Link>

      <p className="help-note">If you are not sure, call 116 117. They will tell you what to do next.</p>
    </section>
  );
}
