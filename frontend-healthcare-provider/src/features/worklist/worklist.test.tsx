// Owner: person 3 — seam 3: rows render in band order; a red row shows the acknowledge control
// until acknowledged; the R7 card shows Own Words verbatim with the spoken/typed label;
// "Flag referral" calls promote (api mocked).
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, vi } from "vitest";

import { api } from "../../api/client";
import type { AlertCard, WorklistRow as Row } from "../../api/types";
import { setSession } from "../../lib/session";
import { SymptomReportCard } from "./SymptomReportCard";
import { WorklistScreen } from "./WorklistScreen";

vi.mock("../../api/client", () => ({
  api: {
    worklist: vi.fn(),
    acknowledge: vi.fn(),
    alertAction: vi.fn(),
    alertCard: vi.fn(),
    promote: vi.fn(),
    callbackHandled: vi.fn(),
    stepHandled: vi.fn(),
  },
}));

const mocked = vi.mocked(api);

function row(over: Partial<Row>): Row {
  return {
    row_id: "alert:a1",
    kind: "alert",
    band: 1,
    level: "red",
    person: { subject_type: "patient", subject_id: "p1", display_name: "Matti K.", county: "Western Uusimaa", phone: "+358 40 123 4567" },
    reason: "Temperature 38,6 °C during treatment",
    delivery_status: [],
    pathway_clock: { day: 3, target_days: 42, next_deadline: "Day 42 (6-week target)" },
    reported_by: null,
    created_at: "2026-11-14T08:42:00+00:00",
    waiting_working_days: 0,
    acknowledged: false,
    actions: ["call", "acknowledge", "mark_done"],
    detail_ref: "a1",
    ...over,
  } as Row;
}

function respond(rows: Row[]) {
  mocked.worklist.mockResolvedValue({
    rows,
    workload: { alerts_today: 4, false_alarm_share: 0.25 },
    current_demo_day: 3,
  });
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/worklist"]}>
      <WorklistScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setSession({ role: "coordinator", coordinatorId: "coordinator-aino" });
});

test("rows render in band order, oldest first within a band", async () => {
  respond([
    row({ row_id: "alert:y", band: 4, level: "yellow", reason: "Yellow thing", actions: ["call"] }),
    row({ row_id: "alert:r2", reason: "Red newer", created_at: "2026-11-14T09:00:00+00:00" }),
    row({ row_id: "alert:r1", reason: "Red older", created_at: "2026-11-14T08:00:00+00:00" }),
    row({ row_id: "callback:c", kind: "callback", band: 2, level: "yellow", reason: "Hoarseness, call-back due", actions: ["call"] }),
  ]);
  renderScreen();
  const items = await screen.findAllByRole("listitem");
  expect(items.map((li) => within(li).getByTestId("reason").textContent)).toEqual([
    "Red older",
    "Red newer",
    "Hoarseness, call-back due",
    "Yellow thing",
  ]);
});

test("a red row keeps its acknowledge control until it is acknowledged", async () => {
  respond([row({})]);
  mocked.acknowledge.mockResolvedValue({});
  renderScreen();
  await userEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));
  expect(mocked.acknowledge).toHaveBeenCalledWith("a1", "coordinator-aino");

  respond([row({ acknowledged: true, actions: ["call", "mark_done"] })]);
  window.dispatchEvent(new Event("demo-day-advanced"));
  expect(await screen.findByText(/Acknowledged/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
});

test("a Patient row shows the Pathway Clock and a Contact row does not", async () => {
  respond([
    row({}),
    row({
      row_id: "callback:c",
      kind: "callback",
      band: 2,
      level: "yellow",
      person: { subject_type: "contact", subject_id: "c1", display_name: "Leena S.", county: "Western Uusimaa", phone: null },
      pathway_clock: null,
      reason: "Hoarseness, call-back due",
      actions: ["call", "flag_referral"],
    }),
  ]);
  renderScreen();
  const [patient, contact] = await screen.findAllByRole("listitem");
  expect(within(patient).getByText("Day 3 of 42")).toBeInTheDocument();
  expect(within(contact).queryByText(/of 42/)).not.toBeInTheDocument();
});

test("Flag referral on a call-back row calls promote for the Contact", async () => {
  respond([
    row({
      row_id: "callback:c",
      kind: "callback",
      band: 2,
      level: "yellow",
      person: { subject_type: "contact", subject_id: "c1", display_name: "Leena S.", county: "Western Uusimaa", phone: null },
      pathway_clock: null,
      reason: "Hoarseness, call-back due",
      actions: ["call", "book_health_station_xray", "flag_referral", "mark_handled"],
      detail_ref: "c1",
    }),
  ]);
  mocked.promote.mockResolvedValue({ patient_id: "p9" });
  renderScreen();
  await userEvent.click(await screen.findByRole("button", { name: "Flag referral" }));
  expect(mocked.promote).toHaveBeenCalledWith("c1");
});

test("a Trusted Person's report says who reported it", async () => {
  respond([row({ reported_by: { actor: "trusted_person", name: "Liisa K." } })]);
  renderScreen();
  expect(await screen.findByText("reported by Liisa K., trusted person")).toBeInTheDocument();
});

test("the workload line shows today's alert count", async () => {
  respond([]);
  renderScreen();
  expect(await screen.findByText(/alerts today/)).toHaveTextContent("4 alerts today");
});

// Spec story 17: the redesigned header no longer shows the false-alarm share.
test.todo("the workload line shows the false-alarm share in Finnish format");

const card: AlertCard = {
  _id: "a1",
  level: "yellow",
  reason: "breathlessness: On stairs or when walking fast",
  actions_taken: [],
  person: { display_name: "Matti K.", phone: "+358 40 123 4567" },
  waiting_working_days: 1,
  promise_working_days: [1, 2],
  reports: [
    {
      event_id: "e1",
      type: "symptom_report",
      created_at: "2026-11-14T08:42:00+00:00",
      actor: "self",
      input: "voice",
      grade: "yellow",
      rule: "breathlessness: On stairs or when walking fast",
      rules_version: "0.1",
      advice_shown: "nurse_review",
      safety_check: { ticked: [] },
      symptoms: [
        {
          symptom: "breathlessness",
          grade: "yellow",
          answers: {},
          answers_plain: [{ question: "When are you short of breath?", answer: "On stairs or when walking fast" }],
        },
      ],
      own_words: { text: "yskin verta eilen illalla", source: "voice" },
    },
  ],
};

test("the R7 card shows Own Words verbatim with the spoken label, the rule and rules version", async () => {
  mocked.alertCard.mockResolvedValue(card);
  render(
    <MemoryRouter initialEntries={["/worklist/alerts/a1"]}>
      <Routes>
        <Route path="/worklist/alerts/:alertId" element={<SymptomReportCard />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("yskin verta eilen illalla")).toBeInTheDocument();
  expect(screen.getByText(/spoken/i)).toBeInTheDocument();
  expect(screen.getByText(/Rules version 0\.1/)).toBeInTheDocument();
  expect(screen.getByText("On stairs or when walking fast", { selector: "dd" })).toBeInTheDocument();
  expect(screen.getByText(/a nurse will review/i)).toBeInTheDocument();
});
