// Seam 2: the shell. Help is reachable from every routed screen's header; Back appears on flow
// screens; the demo bar is labelled demo-only and advancing refetches.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { App } from "../App";
import { setSession } from "../lib/session";
import { patient, rules } from "../test/fixtures";

vi.mock("../api/client", () => ({
  api: {
    health: vi.fn(),
    advanceDay: vi.fn(),
    rules: vi.fn(),
    getPatient: vi.fn(),
    getContact: vi.fn(),
    trustedView: vi.fn(),
    identities: vi.fn(),
    kantaMedicines: vi.fn(),
  },
}));
import { api } from "../api/client";

const mockApi = vi.mocked(api, true);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1", contactId: "c1" });
  mockApi.health.mockResolvedValue({ status: "ok", db: true, current_demo_day: 3 });
  mockApi.advanceDay.mockResolvedValue({ current_demo_day: 4 });
  mockApi.rules.mockResolvedValue(rules);
  mockApi.getPatient.mockResolvedValue(patient);
  mockApi.trustedView.mockResolvedValue({
    _id: "p1", status: "on_track", next_step: patient.next_step, appointments: [], trusted_people: [],
  });
});

const ROUTED = [
  "/risk-check",
  "/warning-signs",
  "/home",
  "/pathway",
  "/confirm/step1",
  "/check-in",
  "/medicines",
  "/learn",
  "/settings",
  "/help",
  "/report",
  "/trusted",
];

test.each(ROUTED)("Help, Read aloud and Aa are in the header of %s", async (path) => {
  renderAt(path);
  const header = await screen.findByRole("banner");
  expect(within(header).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  expect(within(header).getByRole("button", { name: "Read aloud" })).toBeInTheDocument();
  expect(within(header).getByRole("link", { name: /text size and settings/i })).toHaveAttribute("href", "/settings");
});

test.each(["/risk-check", "/check-in", "/report", "/confirm/step1"])("Back is in the header of the flow screen %s", async (path) => {
  renderAt(path);
  const header = await screen.findByRole("banner");
  expect(within(header).getByRole("button", { name: "Back" })).toBeInTheDocument();
});

test("Back is not shown on Home", async () => {
  renderAt("/home");
  const header = await screen.findByRole("banner");
  expect(within(header).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
});

test("saved text size and contrast are applied on whichever screen the person opens", async () => {
  mockApi.getPatient.mockResolvedValue({
    ...patient,
    accessibility: { read_aloud: false, voice_mode: false, text_size: "xl", high_contrast: true },
  });
  renderAt("/pathway");
  await waitFor(() => expect(document.documentElement.dataset.textSize).toBe("xl"));
  expect(document.documentElement.dataset.contrast).toBe("high");
});

test("a Trusted Person never triggers a request for the full Patient record", async () => {
  setSession({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
  renderAt("/trusted");
  await screen.findByRole("banner");
  await waitFor(() => expect(mockApi.trustedView).toHaveBeenCalled());
  expect(mockApi.getPatient).not.toHaveBeenCalled();
});

test("bottom bar offers Home, Pathway, Medicines and Learn with the current tab marked", async () => {
  renderAt("/pathway");
  const nav = await screen.findByRole("navigation", { name: "Main" });
  for (const name of ["Home", "Pathway", "Medicines", "Learn"]) {
    expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
  }
  expect(within(nav).getByRole("link", { name: "Pathway" })).toHaveAttribute("aria-current", "page");
});

test("demo bar shows the demo day, says demo only, and advances one day", async () => {
  const user = userEvent.setup();
  renderAt("/home");
  expect(await screen.findByText(/demo only · day 3/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Advance one day" }));
  await waitFor(() => expect(screen.getByText(/demo only · day 4/i)).toBeInTheDocument());
  expect(mockApi.advanceDay).toHaveBeenCalledTimes(1);
});
