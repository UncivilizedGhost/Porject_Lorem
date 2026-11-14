// Owner: person 2 — Back on every flow screen (risk check, check-in, symptom report, confirmation).
// Tab roots have nothing to go back to, so the slot stays empty there.
import { useLocation, useNavigate } from "react-router-dom";

const FLOW_PREFIXES = ["/risk-check", "/check-in", "/report", "/confirm"];

function ChevronLeft() {
  return (
    <svg width="34" height="34" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M13 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (!FLOW_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="Back">
      <ChevronLeft />
    </button>
  );
}
