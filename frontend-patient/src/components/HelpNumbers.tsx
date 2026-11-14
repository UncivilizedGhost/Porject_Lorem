// Owner: person 2 — the help numbers in spec order, reused on Help, the Check-in red screen,
// R2 Call now and the care-plan card. The HUS Cancer Center is never listed as an urgent line.
export const HELP_NUMBERS = [
  { label: "112", when: "In an emergency" },
  { label: "116 117", when: "Suddenly feel much worse, day or night (Päivystysapu). During treatment, 38 °C or more means the emergency department." },
  { label: "Nurse Aino", when: "Weekdays 8–16, questions about your pathway" },
  { label: "Report a symptom", when: "Anything non-urgent; reply within 1–2 working days" },
];

export function HelpNumbers() {
  return (
    <ol>
      {HELP_NUMBERS.map((n) => (
        <li key={n.label}><strong>{n.label}</strong> — {n.when}</li>
      ))}
    </ol>
  );
}
