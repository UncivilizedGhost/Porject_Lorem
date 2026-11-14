// Owner: person 2 — the end of the check-in. call_now → the red Call now screen; otherwise the
// thank-you wears the Who to call layout (help.html) so the numbers are one tap away from the
// result: 112 (red), 116 117 (dark), Tell Nurse Aino (white), then Home.
import { Link } from "react-router-dom";

import type { AdviceShown } from "../../api/types";
import { useReadable } from "../../voice/useReadable";
import { R2CallNow } from "../SymptomReport/R2CallNow";

const thanks = {
  heading: "Thank you",
  body: "Your check-in was sent to Nurse Aino. Your next check-in is in about a week.",
};

function CheckIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Thanks() {
  useReadable(thanks);
  return (
    <section className="help-screen">
      <span className="sent-check"><CheckIcon /></span>

      <div className="help-heading">
        <h1 className="help-title">Thank you</h1>
        <p className="help-sub">Your check-in was sent to Nurse Aino. Your next check-in is in about a week.</p>
      </div>

      <a className="help-call emergency" href="tel:112">
        <span className="help-call-title">Call 112</span>
        <span className="help-call-sub">Emergency: chest pain, heavy bleeding, struggling to breathe</span>
      </a>

      <a className="help-call urgent" href="tel:116117">
        <span className="help-call-title">Call 116 117</span>
        <span className="help-call-sub">If you feel worse before the next check-in</span>
      </a>

      <Link className="help-call nurse" to="/report">
        <span className="help-call-title">Tell Nurse Aino</span>
        <span className="help-call-sub">Weekdays 8–16 · she calls you back</span>
      </Link>

      <p className="help-note">If something changes before your next check-in, report it. Do not wait for the week to pass.</p>

      <Link className="sent-home" to="/home">Home</Link>
    </section>
  );
}

export function CheckInResult({ advice }: { advice: AdviceShown }) {
  return advice === "call_now" ? <R2CallNow reason={null} /> : <Thanks />;
}
