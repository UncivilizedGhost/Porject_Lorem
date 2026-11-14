// Owner: person 1 — % within target → band. Boundaries: 59 → under-60, 60–69, 70–79 (Norway), 80+ (Sweden).
export type Band = "under_60" | "60_69" | "70_79" | "80_plus";

export function band(pct: number): Band {
  if (pct >= 80) return "80_plus";
  if (pct >= 70) return "70_79";
  if (pct >= 60) return "60_69";
  return "under_60";
}
