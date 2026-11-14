// Shared test data. The shapes follow what GET /rules and GET /patients/{id} return.
import type { PatientView, RulesCatalogue } from "../api/types";

export const rules: RulesCatalogue = {
  rules_version: "0.3",
  safety_check_items: [
    { id: "chest_pain_now", label: "Chest pain right now" },
    { id: "coughing_blood_now", label: "Coughing up blood right now" },
  ],
  symptoms: [
    {
      id: "pain",
      label: "Pain",
      questions: [
        {
          id: "pain_severity",
          prompt: "How bad is the pain?",
          kind: "choice",
          options: [
            { id: "mild", label: "Mild" },
            { id: "severe", label: "Severe" },
          ],
        },
      ],
    },
    {
      id: "fever_unwell",
      label: "Fever or unwell",
      questions: [{ id: "temperature", prompt: "What is your temperature?", kind: "number", unit: "°C" }],
    },
    { id: "other", label: "Something else", questions: [] },
  ],
  other_symptom_questions: [
    {
      id: "other_severity",
      prompt: "How bad is it?",
      kind: "choice",
      options: [
        { id: "mild", label: "Mild" },
        { id: "severe", label: "Severe" },
      ],
    },
  ],
  checkin_items: [
    {
      id: "cough",
      prompt: "How much did your cough bother you this week?",
      kind: "choice",
      options: [
        { id: "none", label: "Not at all" },
        { id: "a_lot", label: "A lot" },
      ],
    },
    { id: "temperature", prompt: "What is your temperature today?", kind: "number", unit: "°C" },
  ],
  warning_signs: [
    { id: "worsening_cough", label: "A cough that is getting worse" },
    { id: "hoarseness", label: "Hoarseness for more than 3 weeks" },
    { id: "coughing_up_blood", label: "Coughing up blood" },
  ],
};

export const patient: PatientView = {
  _id: "p1",
  county: "Western Uusimaa",
  language: "en",
  status: "on_track",
  accessibility: { read_aloud: false, voice_mode: false, text_size: "m", high_contrast: false },
  trusted_people: [{ name: "Liisa Virtanen", relationship: "daughter" }],
  pathway_steps: [
    { id: "health_station_xray", label: "Health station visit and chest X-ray", location: "Health station", state: "done", date: "2026-11-14", date_is_estimate: false, time: "09:00", expected_day: 0 },
    { id: "chest_ct", label: "Chest CT", location: "Jorvi Hospital, Espoo (HUS imaging)", state: "next", date: "2026-11-18", date_is_estimate: true, time: "09:30", expected_day: 7 },
    { id: "bronchoscopy", label: "Bronchoscopy", location: "HUS Heart and Lung Center", state: "later", date: "2026-11-25", date_is_estimate: true, time: "10:00", expected_day: 14 },
  ],
  next_step: {
    id: "chest_ct",
    what: "Chest CT",
    date: "2026-11-18",
    time: "09:30",
    where: "Jorvi Hospital, Espoo (HUS imaging)",
    what_to_bring: ["Kela card"],
    pending_confirmation: { id: "step1", kind: "appointment" },
  },
  medicines: [
    { id: "med_morning", label: "Cancer medicine, tablets, morning", time_critical: true },
    { id: "med_nausea", label: "Medicine for nausea, when needed", time_critical: false },
  ],
};
