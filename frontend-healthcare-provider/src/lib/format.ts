// Finnish display formats. Values from the server are ISO; format only here, never in the database.
//   dates   18.11.  or  14.11.2026
//   times   9.30
//   decimals with a comma: 38,6 °C

export function formatDate(iso: string, withYear = false): string {
  const d = new Date(iso);
  const dm = `${d.getDate()}.${d.getMonth() + 1}.`;
  return withYear ? `${dm}${d.getFullYear()}` : dm;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(".", ",");
}

// Finnish style: a space before the percent sign. Whole numbers, e.g. "64 %".
export function formatPercent(value: number, digits = 0): string {
  return `${formatDecimal(value, digits)} %`;
}

// A range of fractions as percent: 0.215, 0.43 → "21,5–43 %". Whole numbers stay whole.
export function formatFractionRange(low: number, high: number): string {
  const part = (f: number) => {
    const p = Math.round(f * 1000) / 10;
    return Number.isInteger(p) ? String(p) : formatDecimal(p, 1);
  };
  return `${part(low)}–${part(high)} %`;
}

export function formatTemperature(celsius: number): string {
  return `${formatDecimal(celsius)} °C`;
}
