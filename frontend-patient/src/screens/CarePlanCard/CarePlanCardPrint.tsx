// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "Printable care-plan card")
// Print-stylesheet view of the next-step card: what / when / where, what to bring (Kela card),
// how to get there (HSL, Kela taxi), Nurse Aino + help numbers in spec order.
import { NURSE_PHONE } from "../../components/HelpNumbers";
import { formatClock, formatDate } from "../../lib/format";
import { usePatient } from "../../lib/usePatient";
import { NoPathwayYet } from "../../components/NoPathwayYet";
import "../../styles/print.css";

export function CarePlanCardPrint() {
  const patient = usePatient();
  const next = patient?.next_step ?? null;
  if (patient === null) return <NoPathwayYet />;
  if (!patient) return <p>Loading…</p>;
  return (
    <main className="care-plan-card">
      <h1>My care plan card</h1>
      {next ? (
        <>
          <h2>Next step</h2>
          <p><strong>{next.what}</strong></p>
          <p>{formatDate(next.date)} at {formatClock(next.time)}</p>
          <p>{next.where}</p>
          <h2>Bring with you</h2>
          <ul>
            {next.what_to_bring.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <h2>How to get there</h2>
          <p>Use the HSL journey planner. Kela taxi reimbursement may cover your trip.</p>
        </>
      ) : (
        <p>There is no next step planned yet.</p>
      )}
      <h2>Who to call</h2>
      <ol>
        <li><strong>112</strong> in an emergency</li>
        <li><strong>116 117</strong> if you suddenly feel much worse, day or night</li>
        <li><strong>Nurse Aino</strong> {NURSE_PHONE}, weekdays 8–16</li>
      </ol>
      <button type="button" className="no-print" onClick={() => window.print()}>Print this card</button>
    </main>
  );
}
