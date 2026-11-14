// Owner: person 2 — "Question 3 of 10" progress for flows.
export function ProgressBar({ step, total }: { step: number; total: number }) {
  return <progress value={step} max={total} aria-label={`Question ${step} of ${total}`} />;
}
