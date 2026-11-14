// Owner: person 4 — seam 3: the hold-to-talk button with the recorder and /voice/stt mocked.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("./readAloud", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./readAloud")>()),
  speak: vi.fn(() => Promise.resolve()),
  stopSpeaking: vi.fn(),
}));
vi.mock("./voiceApi", () => ({ fetchTts: vi.fn(), fetchStt: vi.fn() }));
vi.mock("./recorder", () => ({ startRecording: vi.fn() }));

import { HoldToTalkButton } from "./HoldToTalkButton";
import { startRecording } from "./recorder";
import { speak } from "./readAloud";
import { useVoiceActions } from "./useVoiceActions";
import { VoiceProvider } from "./VoiceProvider";
import { fetchStt } from "./voiceApi";

const run = vi.fn();
const actions = [{ id: "yes_fever", label: "Fever", run }];

function Screen() {
  useVoiceActions(actions);
  return <HoldToTalkButton />;
}

const stop = vi.fn(async () => new Blob(["audio"]));

beforeEach(() => {
  run.mockClear();
  stop.mockClear();
  vi.mocked(speak).mockClear();
  vi.mocked(fetchStt).mockReset();
  vi.mocked(startRecording).mockReset();
  vi.mocked(startRecording).mockResolvedValue({ stop });
});

test("the button is not shown when Voice Mode is off", () => {
  render(
    <VoiceProvider initialSettings={{ voice_mode: false }}>
      <Screen />
    </VoiceProvider>,
  );
  expect(screen.queryByRole("button", { name: /hold to speak/i })).toBeNull();
});

test("the button is at least 56 px and never records until it is held", () => {
  render(
    <VoiceProvider initialSettings={{ voice_mode: true }}>
      <Screen />
    </VoiceProvider>,
  );
  const button = screen.getByRole("button", { name: /hold to speak/i });
  expect(parseInt(button.style.minHeight)).toBeGreaterThanOrEqual(56);
  expect(parseInt(button.style.minWidth)).toBeGreaterThanOrEqual(56);
  expect(startRecording).not.toHaveBeenCalled();
});

test("hold records, release sends to speech-to-text and the transcript is read back", async () => {
  vi.mocked(fetchStt).mockResolvedValue("fever");
  render(
    <VoiceProvider initialSettings={{ voice_mode: true, language: "en" }}>
      <Screen />
    </VoiceProvider>,
  );
  const button = screen.getByRole("button", { name: /hold to speak/i });
  await act(async () => {
    fireEvent.pointerDown(button);
  });
  expect(startRecording).toHaveBeenCalledTimes(1);
  expect(stop).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.pointerUp(button);
  });
  await waitFor(() => expect(fetchStt).toHaveBeenCalledWith(expect.any(Blob), "en"));
  await waitFor(() => expect(vi.mocked(speak).mock.calls.at(-1)?.[0]).toMatch(/^Fever\? .*yes or no/i));
  expect(run).not.toHaveBeenCalled();
});

test("when speech-to-text is down the person is told, nothing runs", async () => {
  vi.mocked(fetchStt).mockResolvedValue(null);
  render(
    <VoiceProvider initialSettings={{ voice_mode: true, language: "en" }}>
      <Screen />
    </VoiceProvider>,
  );
  const button = screen.getByRole("button", { name: /hold to speak/i });
  await act(async () => {
    fireEvent.pointerDown(button);
  });
  await act(async () => {
    fireEvent.pointerUp(button);
  });
  await waitFor(() => expect(vi.mocked(speak).mock.calls.at(-1)?.[0]).toMatch(/voice is not available/i));
  expect(run).not.toHaveBeenCalled();
});
