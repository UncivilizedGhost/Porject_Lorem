// Seam 2: the weekly Check-in — one item per screen with progress and Previous/Next; a red
// grade goes straight to "Call now".
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { setSession } from "../../lib/session";
import { rules } from "../../test/fixtures";
import { CheckInFlow } from "./CheckInFlow";

vi.mock("../../api/client", () => ({ api: { rules: vi.fn(), checkin: vi.fn() } }));
import { api } from "../../api/client";

const mockApi = vi.mocked(api, true);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  setSession({ role: "patient", patientId: "p1" });
  mockApi.rules.mockResolvedValue(rules);
  mockApi.checkin.mockResolvedValue({ grade: "green", advice_shown: "self_care" });
});

function renderFlow() {
  return render(
    <MemoryRouter>
      <CheckInFlow />
    </MemoryRouter>,
  );
}

async function answerAll(user: ReturnType<typeof userEvent.setup>, temperature: string[]) {
  await user.click(await screen.findByRole("radio", { name: "A lot" }));
  await user.click(screen.getByRole("button", { name: "Next question" }));
  for (const k of temperature) await user.click(await screen.findByRole("button", { name: k }));
  await user.click(screen.getByRole("button", { name: "Send check-in" }));
}

test("shows one item per screen with progress and Previous / Next", async () => {
  const user = userEvent.setup();
  renderFlow();
  expect(await screen.findByText("1 of 2")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: /cough bother you/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "A lot" }));
  await user.click(screen.getByRole("button", { name: "Next question" }));
  expect(await screen.findByText("2 of 2")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: /current temperature/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(await screen.findByRole("group", { name: /cough bother you/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "A lot" })).toBeChecked();
});

test("sends the answers, with the temperature as a number, once at the end", async () => {
  const user = userEvent.setup();
  renderFlow();
  await answerAll(user, ["3", "7", ",", "2"]);
  await waitFor(() =>
    expect(mockApi.checkin).toHaveBeenCalledWith("p1", {
      answers: { cough: "a_lot", temperature: 37.2 },
      actor: "self",
    }),
  );
  expect(mockApi.checkin).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole("heading", { name: /thank you/i })).toBeInTheDocument();
});

test("a red result shows Call now with 116 117, 112 and that Nurse Aino was told too", async () => {
  mockApi.checkin.mockResolvedValue({ grade: "red", advice_shown: "call_now" });
  const user = userEvent.setup();
  renderFlow();
  await answerAll(user, ["3", "8", ",", "6"]);
  expect(await screen.findByRole("heading", { name: /call now/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /call 116 117/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /call 112/i })).toBeInTheDocument();
  expect(screen.getByText(/we have told nurse aino too/i)).toBeInTheDocument();
});

test("a Trusted Person's check-in is sent as trusted_person", async () => {
  setSession({ role: "trusted_person", patientId: "p1", trustedPersonName: "Liisa Virtanen" });
  const user = userEvent.setup();
  renderFlow();
  await answerAll(user, ["3", "7"]);
  await waitFor(() =>
    expect(mockApi.checkin).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ actor: "trusted_person", trusted_person_name: "Liisa Virtanen" }),
    ),
  );
});
