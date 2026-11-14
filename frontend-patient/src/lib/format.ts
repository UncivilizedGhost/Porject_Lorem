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

export function formatTemperature(celsius: number): string {
  return `${formatDecimal(celsius)} °C`;
}
