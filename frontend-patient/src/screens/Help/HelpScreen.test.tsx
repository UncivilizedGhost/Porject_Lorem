// Seam 2: Help lists 112, then 116 117, then Tell Nurse Aino, by urgency.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { HelpScreen } from "./HelpScreen";

function renderHelp() {
  return render(
    <MemoryRouter>
      <HelpScreen />
    </MemoryRouter>,
  );
}

test("numbers are ranked by urgency", () => {
  renderHelp();
  const links = screen.getAllByRole("link");
  expect(links.map((l) => l.textContent)).toEqual([
    expect.stringContaining("112"),
    expect.stringContaining("116 117"),
    expect.stringContaining("Nurse Aino"),
  ]);
});

// Spec story 11: the redesigned Help screen no longer says it.
test.todo("38 °C or more means the emergency department");

test("the numbers can be tapped to call and Tell Nurse Aino opens the report", () => {
  renderHelp();
  expect(screen.getByRole("link", { name: /call 112/i })).toHaveAttribute("href", "tel:112");
  expect(screen.getByRole("link", { name: /call 116 117/i })).toHaveAttribute("href", "tel:116117");
  expect(screen.getByRole("link", { name: /tell nurse aino/i })).toHaveAttribute("href", "/report");
});

test("the HUS Cancer Center is not listed as an urgent line", () => {
  renderHelp();
  expect(document.body.textContent).not.toMatch(/cancer center/i);
});
