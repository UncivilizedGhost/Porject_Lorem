// Owner: person 2 — one question per screen: a vertical list of ≥48 px <button>s with visible
// labels. Each button is also registered as a voice action by the screen.
import { useMemo } from "react";

import { useVoiceActions } from "../voice/useVoiceActions";

export interface Choice { id: string; label: string }

interface Props {
  choices: Choice[];
  onPick: (id: string) => void;
  /** When given, the list is a single-choice toggle group and marks the chosen button. */
  selected?: string;
}

export function ChoiceList({ choices, onPick, selected }: Props) {
  const actions = useMemo(
    () => choices.map((c) => ({ id: `choice:${c.id}`, label: c.label, run: () => onPick(c.id) })),
    [choices, onPick],
  );
  useVoiceActions(actions);
  return (
    <div role="group" className="choice-list">
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={selected === undefined ? undefined : selected === c.id}
          onClick={() => onPick(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
