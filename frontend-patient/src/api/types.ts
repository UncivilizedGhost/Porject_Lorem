// Client-side mirror of the data contract (.scratch/pathway-companion/spec.md → Data contract)
// and of the derived blocks GET /patients/{id} returns.

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

export interface Option {
  id: string;
  label: string;
}

/** One question from GET /rules (guided questions, Check-in items, "something else" triple). */
export interface Question {
  id: string;
  prompt: string;
  kind: "choice" | "number";
  options?: Option[];
  unit?: string;
}

export interface SymptomDef {
  id: string;
  label: string;
  questions: Question[];
}

export interface RulesCatalogue {
  rules_version: string;
  safety_check_items: Option[];
  symptoms: SymptomDef[];
  other_symptom_questions: Question[];
  checkin_items: Question[];
  warning_signs: Option[];
}

export interface SymptomReportBody {
  safety_check: { ticked: string[] };
  symptoms: { symptom: string; answers: Record<string, string | number> }[];
  own_words: { text: string; source: "voice" | "typed" } | null;
  actor: Actor;
  trusted_person_name?: string;
}

export interface ReportResult {
  grade: Grade;
  advice_shown: AdviceShown;
  rule?: string;
}

export interface PathwayStep {
  id: string;
  label: string;
  location: string;
  state: "done" | "next" | "later";
  date: string;
  date_is_estimate: boolean;
  time: string;
  expected_day: number;
}

export interface PendingConfirmation {
  id: string;
  kind: "appointment" | "safety_check" | "medication";
}

export interface NextStep {
  id: string;
  what: string;
  date: string;
  time: string;
  where: string;
  what_to_bring: string[];
  pending_confirmation: PendingConfirmation | null;
}

export interface Medicine {
  id: string;
  label: string;
  time_critical: boolean;
}

export interface TrustedPerson {
  name: string;
  relationship: string;
}

export interface PatientView {
  _id: string;
  county: string;
  language: Language;
  status: "on_track" | "running_late";
  accessibility: Accessibility;
  trusted_people: TrustedPerson[];
  pathway_steps: PathwayStep[];
  next_step: NextStep | null;
  medicines: Medicine[];
}

export interface TrustedView {
  _id: string;
  status: "on_track" | "running_late";
  next_step: NextStep | null;
  appointments: { _id: string; what: string; at: string; where: string }[];
  trusted_people: TrustedPerson[];
  accessibility?: Accessibility;
}

export interface ContactView {
  _id: string;
  county: string;
  language: Language;
  accessibility: Accessibility;
  promoted_patient_id: string | null;
  risk_check: { taken: boolean; risk_group: string | null };
}

export interface Identities {
  coordinator_id?: string;
  contact_id?: string | null;
  patient_id?: string | null;
  trusted_person?: { name: string; relationship?: string; contact_method?: string } | null;
  current_demo_day?: number;
}
