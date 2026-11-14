// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "R1 · Safety check first")
// The 7 "right now?" items as buttons + "None of these" primary; always-visible notice.
// Any item → R2 in one tap.
import { useMemo } from "react";

import type { Option } from "../../api/types";
import { useReadable } from "../../voice/useReadable";
import { useVoiceActions } from "../../voice/useVoiceActions";

interface Props {
  items: Option[];
  onTick: (item: Option) => void;
  onNone: () => void;
}

export function R1SafetyCheck({ items, onTick, onNone }: Props) {
  const readable = useMemo(
    () => ({
      heading: "Is any of this happening right now?",
      body: "Tap what is happening, or None of these.",
      priority: "This is not an emergency service. Phone 116 117 or 112 if you need urgent help.",
    }),
    [],
  );
  useReadable(readable);
  const actions = useMemo(
    () => [
      { id: "safety:none", label: "None of these", synonyms: ["no", "nothing"], run: onNone },
      ...items.map((i) => ({ id: `safety:${i.id}`, label: i.label, run: () => onTick(i) })),
    ],
    [items, onTick, onNone],
  );
  useVoiceActions(actions);

  return (
    <section>
      <h1>Is any of this happening right now?</h1>
      <p className="notice" role="note">
        This is not an emergency service. A nurse replies within 1–2 working days. For urgent help
        phone 116 117 or 112.
      </p>
      <div role="group" aria-label="Right now" className="choice-list">
        {items.map((i) => (
          <button key={i.id} type="button" onClick={() => onTick(i)}>{i.label}</button>
        ))}
      </div>
      <button type="button" className="primary" onClick={onNone}>None of these</button>
    </section>
  );
}
