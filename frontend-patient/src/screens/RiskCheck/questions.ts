// Owner: person 2 — the risk-check questions (ids match the server's risk_check service input).
// Eligibility is computed server-side; this file only defines the screens.

export type QuestionId =
  | "age"
  | "county"
  | "sex"
  | "current_smoker"
  | "cigarettes_per_day"
  | "years_smoked"
  | "ex_smoker"
  | "frequent_coughing"
  | "breathlessness"
  | "inhaled_medication"
  | "lung_diagnosis"
  | "malignancy";

export const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
] as const;

export const MALE_FEMALE = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
] as const;

export const COUNTIES = [
  "Western Uusimaa", "Vantaa-Kerava", "Central Uusimaa", "Eastern Uusimaa", "Helsinki",
  "Pirkanmaa", "Ostrobothnia", "North Ostrobothnia", "Southwest Finland",
  "Kymenlaakso", "South Karelia", "South Savo", "North Savo", "North Karelia", "Central Finland",
  "South Ostrobothnia", "Central Ostrobothnia", "Kainuu", "Lapland", "Päijät-Häme", "Kanta-Häme",
  "Satakunta", "Åland",
] as const;

export const RISK_CHECK_QUESTIONS: Array<{
  id: QuestionId;
  prompt: string;
  kind: "number" | "choice";
  options?: ReadonlyArray<{ id: string; label: string }>;
  /** If present, this question is only shown when the condition is met. */
  showWhen?: (answers: Record<string, string | number>) => boolean;
}> = [
  { id: "age", prompt: "What is your age?", kind: "number" },
  { id: "county", prompt: "Which wellbeing services county do you live in?", kind: "choice",
    options: COUNTIES.map((c) => ({ id: c, label: c })) },
  { id: "sex", prompt: "What sex were you born?", kind: "choice", options: MALE_FEMALE },
  { id: "current_smoker", prompt: "Are you a current smoker?", kind: "choice", options: YES_NO },
  {
    id: "cigarettes_per_day",
    prompt: "How many cigarettes do you smoke per day?",
    kind: "number",
    showWhen: (answers) => answers.current_smoker === "yes",
  },
  {
    id: "years_smoked",
    prompt: "For how many years have you been smoking?",
    kind: "number",
    showWhen: (answers) => answers.current_smoker === "yes",
  },
  {
    id: "ex_smoker",
    prompt: "Are you an ex-smoker?",
    kind: "choice",
    options: YES_NO,
    showWhen: (answers) => answers.current_smoker === "no",
  },
  {
    id: "years_smoked",
    prompt: "For how many years have you been smoking?",
    kind: "number",
    showWhen: (answers) => answers.ex_smoker === "yes",
  },
  { id: "frequent_coughing", prompt: "Do you suffer from frequent coughing?", kind: "choice", options: YES_NO },
  { id: "breathlessness", prompt: "Do you suffer from breathlessness?", kind: "choice", options: YES_NO },
  { id: "inhaled_medication", prompt: "Do you currently use any inhaled medication?", kind: "choice", options: YES_NO },
  {
    id: "lung_diagnosis",
    prompt: "Have you ever been diagnosed with Pneumonia, Emphysema, Bronchitis, TB or COPD?",
    kind: "choice",
    options: YES_NO,
  },
  { id: "malignancy", prompt: "Have you ever been diagnosed a malignancy or cancer?", kind: "choice", options: YES_NO },
] as const;

/** The questions to ask given the answers so far, applying path branching. */
export function questionsFor(answers: Record<string, string | number>) {
  return RISK_CHECK_QUESTIONS.filter((q) => {
    if (!q.showWhen) return true;
    return q.showWhen(answers);
  });
}
