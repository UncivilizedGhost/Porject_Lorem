// Owner: person 2 — one question per screen: a vertical list of ≥48 px <button>s with visible
// labels. Each button is also registered as a voice action by the screen.
export interface Choice { id: string; label: string }

export function ChoiceList({ choices, onPick }: { choices: Choice[]; onPick: (id: string) => void }) {
  return (
    <div role="group">
      {choices.map((c) => (
        <button key={c.id} type="button" onClick={() => onPick(c.id)}>{c.label}</button>
      ))}
    </div>
  );
}
