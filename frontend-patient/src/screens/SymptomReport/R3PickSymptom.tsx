// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R3 · Pick a symptom")
// One symptom at a time; the list comes from GET /rules.
import { useMemo } from "react";

import type { SymptomDef } from "../../api/types";
import { ChoiceList } from "../../components/ChoiceList";
import { useReadable } from "../../voice/useReadable";

export function R3PickSymptom({ symptoms, onPick }: { symptoms: SymptomDef[]; onPick: (id: string) => void }) {
  const choices = useMemo(() => symptoms.map((s) => ({ id: s.id, label: s.label })), [symptoms]);
  const readable = useMemo(() => ({ heading: "What symptom is bothering you?", body: "Pick one." }), []);
  useReadable(readable);
  return (
    <section>
      <h1>What symptom is bothering you?</h1>
      <p>Pick one. You can add another afterwards.</p>
      <ChoiceList choices={choices} onPick={onPick} />
    </section>
  );
}
