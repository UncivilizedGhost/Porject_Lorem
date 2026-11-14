// Owner: person 2 — alarm-style slide-to-confirm (pointer events, keyboard-operable) with a real
// <button> "Or tap here to confirm" under it. Used only for the three alarm cases.
interface Props { label: string; onConfirm: () => void }

export function SlideToConfirm({ label, onConfirm }: Props) {
  // TODO: slider track + thumb
  return (
    <div>
      <div role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} tabIndex={0} />
      <button type="button" className="primary" onClick={onConfirm}>Or tap here to confirm</button>
    </div>
  );
}
