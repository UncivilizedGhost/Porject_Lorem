// Owner: person 2 — Back on every flow screen (risk check, check-in, symptom report, confirmation).
import { useLocation, useNavigate } from "react-router-dom";

const FLOW_PREFIXES = ["/risk-check", "/check-in", "/report", "/confirm"];

export function BackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (!FLOW_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <button type="button" onClick={() => navigate(-1)}>Back</button>
  );
}
