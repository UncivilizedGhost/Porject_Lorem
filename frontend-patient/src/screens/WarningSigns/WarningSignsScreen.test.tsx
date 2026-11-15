// Seam 2: tap to select/deselect any number of warning signs, then Continue sends them all.
// Coughing up blood tells the person to seek care today.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
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

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<WarningSignsScreen />} />
        <Route path="/home" element={<Where />} />
        <Route path="/trusted" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function getCoughButton() {
  return await screen.findByRole("button", { name: /A cough that is getting worse/ });
}

async function getBloodButton() {
  return await screen.findByRole("button", { name: /Coughing up blood/ });
}

async function getContinueButton() {
  return await screen.findByRole("button", { name: /None of these apply to me|Submit symptoms/i });
}

test("shows the updated title and all warning signs as toggle buttons", async () => {
  renderScreen();
  expect(await screen.findByText("Choose all symptoms which apply to you")).toBeInTheDocument();
  await getCoughButton();
  expect(await screen.findByText("Hoarseness for more than 3 weeks")).toBeInTheDocument();
  expect(await screen.findByText("Coughing up blood")).toBeInTheDocument();
});

test("tapping a sign selects it, tapping again deselects it", async () => {
  renderScreen();
  const coughButton = await getCoughButton();
  expect(coughButton).not.toHaveAttribute("aria-pressed", "true");

  await userEvent.click(coughButton);
  expect(coughButton).toHaveAttribute("aria-pressed", "true");

  await userEvent.click(coughButton);
  expect(coughButton).not.toHaveAttribute("aria-pressed", "true");
});

test("button says 'None of these apply to me' when nothing selected", async () => {
  renderScreen();
  const button = await getContinueButton();
  expect(button).toHaveTextContent("None of these apply to me");

  // Clicking it navigates without calling the API
  const user = userEvent.setup();
  await user.click(button);
  expect(mockApi.warningSignTap).not.toHaveBeenCalled();
});

test("button says 'Submit symptoms' when something is selected", async () => {
  renderScreen();
  const coughButton = await getCoughButton();
  await userEvent.click(coughButton);
  const button = await getContinueButton();
  expect(button).toHaveTextContent("Submit symptoms");
});

test("Continue with no selection navigates home without calling the API", async () => {
  renderScreen();
  const user = userEvent.setup();
  await user.click(await getContinueButton());
  // No API call should have been made
  expect(mockApi.warningSignTap).not.toHaveBeenCalled();
  expect(await screen.findByTestId("where")).toHaveTextContent("/home");
});

test("Continue sends all selected signs to the API and navigates home", async () => {
  mockApi.warningSignTap.mockResolvedValue({ grade: "yellow", advice: "callback" });
  const user = userEvent.setup();
  renderScreen();

  await user.click(await getCoughButton());
  await user.click(await getBloodButton());
  await user.click(await getContinueButton());

  expect(mockApi.warningSignTap).toHaveBeenCalledTimes(2);
  expect(mockApi.warningSignTap).toHaveBeenCalledWith("c1", { symptom: "worsening_cough", actor: "self" });
  expect(mockApi.warningSignTap).toHaveBeenCalledWith("c1", { symptom: "coughing_up_blood", actor: "self" });
  expect(await screen.findByTestId("where")).toHaveTextContent("/home");
});

test("coughing up blood sends to API and navigates home", async () => {
  mockApi.warningSignTap.mockResolvedValue({ grade: "red", advice: "seek_care_today" });
  const user = userEvent.setup();
  renderScreen();

  await user.click(await getBloodButton());
  await user.click(await getContinueButton());

  expect(mockApi.warningSignTap).toHaveBeenCalledWith("c1", { symptom: "coughing_up_blood", actor: "self" });
  expect(await screen.findByTestId("where")).toHaveTextContent("/home");
});

test("submit navigates home after sending symptoms", async () => {
  mockApi.warningSignTap.mockResolvedValue({ grade: "yellow", advice: "callback" });
  const user = userEvent.setup();
  renderScreen();

  await user.click(await getCoughButton());
  await user.click(await getContinueButton());

  expect(mockApi.warningSignTap).toHaveBeenCalledTimes(1);
  expect(mockApi.warningSignTap).toHaveBeenCalledWith("c1", { symptom: "worsening_cough", actor: "self" });
  expect(await screen.findByTestId("where")).toHaveTextContent("/home");
});
