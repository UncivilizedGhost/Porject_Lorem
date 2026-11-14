// Finnish display formats. Values from the server are ISO; format only here, never in the database.
//   dates   18.11.  or  14.11.2026
//   times   9.30
//   decimals with a comma: 38,6 °C

/** A date-only ISO string ("2026-11-18") is read as a local date so no time zone can shift it. */
function parse(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

export function formatDate(iso: string, withYear = false): string {
  const d = parse(iso);
  const dm = `${d.getDate()}.${d.getMonth() + 1}.`;
  return withYear ? `${dm}${d.getFullYear()}` : dm;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** A time of day from the server ("09:30") → "9.30". */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}.${m}`;
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(".", ",");
}

export function formatTemperature(celsius: number): string {
  return `${formatDecimal(celsius)} °C`;
}
