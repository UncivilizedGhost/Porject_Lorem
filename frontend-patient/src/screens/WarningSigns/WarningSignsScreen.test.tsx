// Seam 2: one tap "I have this" raises a warning sign; a nurse call-back is promised, and
// coughing up blood tells the person to seek care today.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { rules } from "../../test/fixtures";
import { WarningSignsScreen } from "./WarningSignsScreen";

vi.mock("../../api/client", () => ({ api: { rules: vi.fn(), warningSignTap: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", contactId: "c1" });
  mockApi.rules.mockResolvedValue(rules);
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <WarningSignsScreen />
    </MemoryRouter>,
  );
}

test("lists the warning signs plainly, each with an I have this button", async () => {
  renderScreen();
  const items = await screen.findAllByRole("listitem");
  expect(items).toHaveLength(3);
  expect(within(items[1]).getByText("Hoarseness for more than 3 weeks")).toBeInTheDocument();
  expect(within(items[1]).getByRole("button", { name: /i have this/i })).toBeInTheDocument();
});

test("a tap sends that sign and promises a nurse call within 1–2 working days", async () => {
  mockApi.warningSignTap.mockResolvedValue({ grade: "yellow", advice: "callback" });
  const user = userEvent.setup();
  renderScreen();
  const items = await screen.findAllByRole("listitem");
  await user.click(within(items[1]).getByRole("button", { name: /i have this/i }));
  await waitFor(() =>
    expect(mockApi.warningSignTap).toHaveBeenCalledWith("c1", { symptom: "hoarseness", actor: "self" }),
  );
  expect(await screen.findByText(/a nurse will call you within 1–2 working days/i)).toBeInTheDocument();
});

test("coughing up blood says to seek care today with the right numbers", async () => {
  mockApi.warningSignTap.mockResolvedValue({ grade: "red", advice: "seek_care_today" });
  const user = userEvent.setup();
  renderScreen();
  const items = await screen.findAllByRole("listitem");
  await user.click(within(items[2]).getByRole("button", { name: /i have this/i }));
  expect(await screen.findByRole("heading", { name: /seek care today/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /call 112/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /call 116 117/i })).toBeInTheDocument();
});
