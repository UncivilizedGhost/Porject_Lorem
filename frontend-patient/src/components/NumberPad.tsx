// Owner: person 2 — big number pad (temperature, age, cigarettes, years). Decimal comma.
interface Props {
  value: string;
  onChange: (v: string) => void;
  allowDecimal?: boolean;
  label?: string;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NumberPad({ value, onChange, allowDecimal = false, label = "Your answer" }: Props) {
  const press = (key: string) => {
    if (key === ",") {
      if (!allowDecimal || value.includes(",")) return;
      onChange(value === "" ? "0," : `${value},`);
      return;
    }
    onChange(value + key);
  };
  return (
    <div role="group" aria-label="Number pad" className="number-pad">
      <output aria-label={label} className="number-pad-value">
        {value === "" ? "–" : value}
      </output>
      <div className="number-pad-keys">
        {DIGITS.map((d) => (
          <button key={d} type="button" onClick={() => press(d)}>{d}</button>
        ))}
        {allowDecimal ? (
          <button type="button" onClick={() => press(",")}>,</button>
        ) : (
          <span aria-hidden="true" />
        )}
        <button type="button" onClick={() => press("0")}>0</button>
        <button type="button" aria-label="Delete last digit" onClick={() => onChange(value.slice(0, -1))}>⌫</button>
      </div>
    </div>
  );
}

/** "38,6" → 38.6 (the number sent to the server). */
export function parseNumber(value: string): number {
  return Number(value.replace(",", "."));
}
