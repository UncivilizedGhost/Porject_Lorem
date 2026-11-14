import { formatDate, formatDecimal, formatTemperature, formatTime } from "./format";

test("Finnish date, time and decimal formats", () => {
  expect(formatDate("2026-11-18T07:30:00")).toBe("18.11.");
  expect(formatDate("2026-11-14T07:30:00", true)).toBe("14.11.2026");
  expect(formatTime("2026-11-18T09:30:00")).toBe("9.30");
  expect(formatDecimal(38.6)).toBe("38,6");
  expect(formatTemperature(38.6)).toBe("38,6 °C");
});
