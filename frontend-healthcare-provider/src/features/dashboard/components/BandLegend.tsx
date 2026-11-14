// Owner: person 1 — .scratch/equity-dashboard/spec.md
// under 60% · 60–69% · 70–79% meets Norway · 80%+ meets Sweden, lightness-distinct swatches.
import type { Band } from "../bands";

const ITEMS: { band: Band; label: string }[] = [
  { band: "under_60", label: "under 60%" },
  { band: "60_69", label: "60–69%" },
  { band: "70_79", label: "70–79% meets Norway" },
  { band: "80_plus", label: "80%+ meets Sweden" },
];

export function BandLegend() {
  return (
    <ul className="band-legend" aria-label="Map legend: share starting treatment within target">
      {ITEMS.map((i) => (
        <li key={i.band}>
          <span className="swatch" data-band={i.band} aria-hidden="true" /> {i.label}
        </li>
      ))}
    </ul>
  );
}
