// Owner: person 2 — the risk-check questions (ids match the server's risk_check service input).
// Eligibility is computed server-side; this file only defines the screens.
export const RISK_CHECK_QUESTIONS = [
  { id: "age", prompt: "How old are you?", kind: "number" },
  { id: "county", prompt: "Which wellbeing services county do you live in?", kind: "choice", options: [] },
  { id: "smoking_status", prompt: "Do you smoke?", kind: "choice", options: [
    { id: "daily", label: "Yes, daily" }, { id: "former", label: "I used to" }, { id: "never", label: "Never" } ] },
  { id: "cigarettes_per_day", prompt: "About how many cigarettes a day?", kind: "number" },
  { id: "years_smoked", prompt: "For about how many years?", kind: "number" },
] as const;
