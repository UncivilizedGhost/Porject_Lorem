// Owner: person 2 — the risk-check questions (ids match the server's risk_check service input).
// Eligibility is computed server-side; this file only defines the screens.
export const COUNTIES = [
  "Western Uusimaa", "Vantaa-Kerava", "Central Uusimaa", "Eastern Uusimaa", "Helsinki",
  "Pirkanmaa", "Ostrobothnia", "North Ostrobothnia", "Southwest Finland",
  "Kymenlaakso", "South Karelia", "South Savo", "North Savo", "North Karelia", "Central Finland",
  "South Ostrobothnia", "Central Ostrobothnia", "Kainuu", "Lapland", "Päijät-Häme", "Kanta-Häme",
  "Satakunta", "Åland",
] as const;

export type QuestionId = "age" | "county" | "smoking_status" | "cigarettes_per_day" | "years_smoked";

export const RISK_CHECK_QUESTIONS = [
  { id: "age", prompt: "How old are you?", kind: "number" },
  { id: "county", prompt: "Which wellbeing services county do you live in?", kind: "choice",
    options: COUNTIES.map((c) => ({ id: c, label: c })) },
  { id: "smoking_status", prompt: "Do you smoke?", kind: "choice", options: [
    { id: "daily", label: "Yes, daily" }, { id: "former", label: "I used to" }, { id: "never", label: "Never" } ] },
  { id: "cigarettes_per_day", prompt: "About how many cigarettes a day?", kind: "number" },
  { id: "years_smoked", prompt: "For about how many years?", kind: "number" },
] as const;

/** The questions to ask given the answers so far: only daily smokers get the last two. */
export function questionsFor(smokingStatus: string | undefined) {
  return RISK_CHECK_QUESTIONS.filter(
    (q) => (q.id !== "cigarettes_per_day" && q.id !== "years_smoked") || smokingStatus === "daily",
  );
}
