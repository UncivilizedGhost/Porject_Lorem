// Owner: person 3 (stretch) — type first, then clinicians, then only free days and slots; confirming books.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, vi } from "vitest";

import { api } from "../../../api/client";
import { BookingScreen } from "./BookingScreen";

vi.mock("../../../api/client", () => ({
  api: { worklist: vi.fn(), clinicians: vi.fn(), availability: vi.fn(), book: vi.fn() },
}));
const mocked = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  // The calendar greys out days before today, so pin the clock to keep the fixture dates bookable.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T09:00:00"));
  mocked.worklist.mockResolvedValue({
    rows: [
      {
        row_id: "callback:c1",
        person: { subject_type: "contact", subject_id: "c1", display_name: "Leena S.", county: "Western Uusimaa" },
      },
    ],
    workload: { alerts_today: 0, false_alarm_share: 0 },
    current_demo_day: 0,
  } as never);
  mocked.clinicians.mockResolvedValue([
    { id: "k1", name: "Dr. Helena Virtanen (synthetic)", types: ["xray_ct"], location: "Jorvi Hospital", working_days: [1], hours: { start: "08:00", end: "15:00" }, slot_minutes: 30 },
  ] as never);
  mocked.availability.mockResolvedValue({
    clinician_id: "k1",
    working_days: [1],
    days: [{ date: "2026-11-16", slots: ["08:00", "08:30"] }],
  } as never);
  mocked.book.mockResolvedValue({ id: "ap1" } as never);
});

afterEach(() => vi.useRealTimers());

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/worklist/book/callback%3Ac1"]}>
      <Routes>
        <Route path="/worklist/book/:rowId" element={<BookingScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("books the chosen slot for the row's person after picking type, clinician and day", async () => {
  renderScreen();
  await userEvent.click(await screen.findByRole("button", { name: "X-ray and low-dose CT" }));
  expect(mocked.clinicians).toHaveBeenCalledWith("xray_ct");
  await userEvent.click(await screen.findByRole("button", { name: /Helena Virtanen/ }));
  await userEvent.click(await screen.findByRole("button", { name: /^16\.11\./ }));
  await userEvent.click(screen.getByRole("button", { name: /^8\.30/ }));
  await userEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
  expect(mocked.book).toHaveBeenCalledWith({
    subject_type: "contact",
    subject_id: "c1",
    clinician_id: "k1",
    type: "xray_ct",
    start: "2026-11-16T08:30",
  });
  expect(await screen.findByText(/text message sent \(simulated\)/i)).toBeInTheDocument();
});

test("confirm is disabled until a slot is chosen", async () => {
  renderScreen();
  expect(await screen.findByRole("button", { name: "Confirm booking" })).toBeDisabled();
});
