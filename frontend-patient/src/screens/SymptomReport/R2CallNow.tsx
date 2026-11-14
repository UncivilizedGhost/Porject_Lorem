// Owner: person 2 — design port of app/report-urgent.html (artboard "R2 · Call now").
// Names what triggered it, two full-width call buttons (112, 116 117), and the note that Nurse
// Aino was told too. The whole frame turns pale red while this screen is up.
import { useMemo } from "react";

import { useTonePage } from "../../shell/PageTone";
import { useReadable } from "../../voice/useReadable";

function WarningIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M11 3l9 16H2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M11 9v4.5M11 16v.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function R2CallNow({ reason }: { reason: string | null }) {
  useTonePage("alert");
  const readable = useMemo(
    () => ({
      heading: "Call now",
      priority: `Call now. ${reason ? `You told us: ${reason}. ` : ""}Phone 112 in an emergency, or 116 117 if you suddenly feel much worse.`,
    }),
    [reason],
  );
  useReadable(readable);

  return (
    <section className="alert-page" role="alert">
      <span className="alert-icon"><WarningIcon /></span>
      <h1 className="alert-title">Please call now.</h1>
      <p className="alert-lead">
        {reason ? `You told us: ${reason}. ` : "You told us you are very unwell. "}
        This needs to be checked today.
      </p>

      <div className="alert-calls">
        <a className="alert-button emergency" href="tel:112">
          Call 112
          <span>If it feels like an emergency</span>
        </a>
        <a className="alert-button urgent" href="tel:116117">
          Call 116 117
          <span>Medical helpline</span>
        </a>
      </div>

      <p className="alert-lead">Or go to the nearest emergency department.</p>
      <p className="alert-note">We have told Nurse Aino too.</p>
    </section>
  );
}
