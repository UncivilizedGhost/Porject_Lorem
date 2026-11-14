// Seam 2: Help lists 112, then 116 117, then Nurse Aino, then Report a symptom, by urgency.
import { render, screen, within } from "@testing-library/react";
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
  const items = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(items.map((i) => i.textContent)).toEqual([
    expect.stringContaining("112"),
    expect.stringContaining("116 117"),
    expect.stringContaining("Nurse Aino"),
    expect.stringContaining("Report a symptom"),
  ]);
});

test("38 °C or more means the emergency department", () => {
  renderHelp();
  expect(screen.getByText(/38 °C or more means the emergency department/i)).toBeInTheDocument();
});

test("the numbers can be tapped to call and Report a symptom opens the report", () => {
  renderHelp();
  expect(screen.getByRole("link", { name: /call 112/i })).toHaveAttribute("href", "tel:112");
  expect(screen.getByRole("link", { name: /call 116 117/i })).toHaveAttribute("href", "tel:116117");
  expect(screen.getByRole("link", { name: "Report a symptom" })).toHaveAttribute("href", "/report");
});

test("the HUS Cancer Center is not listed as an urgent line", () => {
  renderHelp();
  expect(document.body.textContent).not.toMatch(/cancer center/i);
});
