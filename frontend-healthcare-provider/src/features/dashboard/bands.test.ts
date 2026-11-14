import { band } from "./bands";

test("band boundaries 59 / 60 / 69 / 70 / 79 / 80", () => {
  expect(band(59)).toBe("under_60");
  expect(band(60)).toBe("60_69");
  expect(band(69)).toBe("60_69");
  expect(band(70)).toBe("70_79");
  expect(band(79)).toBe("70_79");
  expect(band(80)).toBe("80_plus");
});
