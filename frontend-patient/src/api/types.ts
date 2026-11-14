// Client-side mirror of the data contract (.scratch/pathway-companion/spec.md → Data contract)
// and of the derived blocks GET /patients/{id} returns. Replace `unknown` as the server lands.

export type Grade = "red" | "yellow" | "green";
export type AdviceShown = "call_now" | "nurse_review" | "self_care";
export type Actor = "self" | "trusted_person";
export type InputMode = "touch" | "voice";
export type Language = "fi" | "sv" | "en";
export type TextSize = "m" | "l" | "xl";

export interface Accessibility {
  read_aloud: boolean;
  voice_mode: boolean;
  text_size: TextSize;
  high_contrast: boolean;
}

export interface RulesCatalogue {
  rules_version: string;
  safety_check_items: unknown[];
  symptoms: unknown[];
  other_symptom_questions: unknown[];
  checkin_items: unknown[];
  warning_signs: unknown[];
}

export interface SymptomReportBody {
  safety_check: { ticked: string[] };
  symptoms: { symptom: string; answers: Record<string, string | number> }[];
  own_words: { text: string; source: "voice" | "typed" } | null;
  actor: Actor;
  trusted_person_name?: string;
}

export interface PatientView {
  // TODO(person 2): pathway_steps, status, next_step (+ pending_confirmation), medicines
  [key: string]: unknown;
}
