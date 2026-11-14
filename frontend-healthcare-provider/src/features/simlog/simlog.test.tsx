// Owner: person 4 — seam 3: every log row shows a "(simulated)" or "FHIR mock-up" badge.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../api/client", () => ({ api: { simLog: vi.fn(), simReply: vi.fn() } }));

import { api } from "../../api/client";
import { SimLogScreen } from "./SimLogScreen";

const rows = [
  {
    id: "e3",
    created_at: "2026-11-14T09:30:00+02:00",
    type: "sms_sent",
    subject_type: "patient",
    subject_id: "p1",
    demo_day: 2,
    payload: { to: "+358401234567", text: "Please confirm your CT on Tuesday", purpose: "confirmation", channel: "sms", simulated: true, status: "sent" },
  },
  {
    id: "e2",
    created_at: "2026-11-14T09:00:00+02:00",
    type: "sms_sent",
    subject_type: "patient",
    subject_id: "p1",
    demo_day: 2,
    payload: { to: "+358401234567", text: "Automated call: please confirm", purpose: "confirmation", channel: "auto_call", simulated: true, status: "sent" },
  },
  {
    id: "e1",
    created_at: "2026-11-14T08:00:00+02:00",
    type: "fhir_sync",
    subject_type: "patient",
    subject_id: "p1",
    demo_day: 1,
    payload: { mock: true, bundle: { resourceType: "Bundle", type: "collection", entry: [{ resource: { resourceType: "Observation" } }] } },
  },
];

beforeEach(() => {
  vi.mocked(api.simLog).mockReset().mockResolvedValue(rows);
  vi.mocked(api.simReply).mockReset().mockResolvedValue({ confirmed: true });
});

test("every row carries a (simulated) or FHIR mock-up badge", async () => {
  render(<SimLogScreen />);
  await screen.findByText("Please confirm your CT on Tuesday");
  const items = screen.getAllByRole("row");
  const body = items.filter((r) => within(r).queryAllByRole("columnheader").length === 0);
  expect(body).toHaveLength(3);
  for (const row of body) {
    expect(within(row).getByText(/^\(simulated\)$|^FHIR mock-up$/)).toBeInTheDocument();
  }
  expect(screen.getAllByText("(simulated)")).toHaveLength(2);
  expect(screen.getAllByText("FHIR mock-up")).toHaveLength(1);
});

test("SMS rows show recipient, text, channel and status", async () => {
  render(<SimLogScreen />);
  expect(await screen.findByText("Please confirm your CT on Tuesday")).toBeInTheDocument();
  expect(screen.getAllByText("+358401234567").length).toBeGreaterThan(0);
  expect(screen.getByText("Automated call", { selector: "td" })).toBeInTheDocument();
  expect(screen.getByText("Text message", { selector: "td" })).toBeInTheDocument();
  expect(screen.getAllByText("sent").length).toBeGreaterThan(0);
});

test("times use the Finnish format", async () => {
  render(<SimLogScreen />);
  await screen.findByText("Please confirm your CT on Tuesday");
  expect(screen.getAllByText(/^\d{1,2}\.\d{1,2}\. \d{1,2}\.\d{2}$/).length).toBe(3);
});

test("a FHIR row has an expandable JSON payload", async () => {
  render(<SimLogScreen />);
  await screen.findByText("Please confirm your CT on Tuesday");
  const summary = screen.getByText("Show FHIR payload");
  await userEvent.click(summary);
  expect(screen.getByText(/"resourceType": "Bundle"/)).toBeVisible();
});

test("Simulate reply sends YES for an SMS row and reloads the log", async () => {
  render(<SimLogScreen />);
  const buttons = await screen.findAllByRole("button", { name: /simulate reply/i });
  await userEvent.click(buttons[0]);
  expect(api.simReply).toHaveBeenCalledWith("e3", "YES");
  await waitFor(() => expect(vi.mocked(api.simLog).mock.calls.length).toBeGreaterThan(1));
});

test("FHIR rows and replied rows have no Simulate reply button", async () => {
  vi.mocked(api.simLog).mockResolvedValue([
    { ...rows[0], id: "r1", payload: { ...rows[0].payload, status: "replied", text: "YES", reply_to: "e0" } },
    rows[2],
  ]);
  render(<SimLogScreen />);
  await screen.findByText("YES");
  expect(screen.queryByRole("button", { name: /simulate reply/i })).toBeNull();
});
