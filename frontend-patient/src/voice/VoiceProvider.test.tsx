// Owner: person 4 — seam 3: the voice layer with /voice/* and the recorder mocked.
import { act, render, screen, waitFor } from "@testing-library/react";
import { useMemo } from "react";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("./readAloud", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./readAloud")>()),
  speak: vi.fn(() => Promise.resolve()),
  stopSpeaking: vi.fn(),
}));
vi.mock("./voiceApi", () => ({ fetchTts: vi.fn(), fetchStt: vi.fn() }));

import { speak } from "./readAloud";
import type { Readable } from "./types";
import { useReadable } from "./useReadable";
import { useVoiceActions } from "./useVoiceActions";
import { useVoice, VoiceProvider, voiceInputMode } from "./VoiceProvider";

const spoken = () => vi.mocked(speak).mock.calls.map((c) => c[0]);

let voice!: ReturnType<typeof useVoice>;
const run = vi.fn();
let inputDuringRun: string | null = null;

function TestScreen({ readable }: { readable?: Readable }) {
  const actions = useMemo(
    () => [
      {
        id: "confirm_ct",
        label: "Confirm the chest CT",
        confirm_text: "Confirm the chest CT on Tuesday at 9.30?",
        run: () => {
          inputDuringRun = voiceInputMode();
          run();
        },
      },
      { id: "cant_come", label: "I can't come", run: vi.fn() },
    ],
    [],
  );
  useVoiceActions(actions);
  useReadable(readable ?? {});
  voice = useVoice();
  return <p>screen</p>;
}

const say = (t: string) => act(async () => voice.handleTranscript(t));

function renderScreen(readable?: Readable, settings = {}) {
  return render(
    <VoiceProvider initialSettings={{ language: "en", voice_mode: true, ...settings }}>
      <TestScreen readable={readable} />
    </VoiceProvider>,
  );
}

beforeEach(() => {
  vi.mocked(speak).mockClear();
  run.mockClear();
  inputDuringRun = null;
});

test("a matched action is read back and does not run until the person says yes", async () => {
  renderScreen();
  await say("confirm the chest CT");
  expect(spoken().at(-1)).toContain("Confirm the chest CT on Tuesday at 9.30?");
  expect(spoken().at(-1)).toMatch(/yes or no/i);
  expect(run).not.toHaveBeenCalled();
  await say("yes");
  expect(run).toHaveBeenCalledTimes(1);
});

test("no cancels the action", async () => {
  renderScreen();
  await say("confirm the chest CT");
  await say("no");
  expect(run).not.toHaveBeenCalled();
  expect(spoken().at(-1)).toBe("OK, cancelled.");
  await say("yes"); // nothing is pending any more
  expect(run).not.toHaveBeenCalled();
});

test("the default read-back is the label as a question", async () => {
  renderScreen();
  await say("I can't come");
  expect(spoken().at(-1)).toMatch(/^I can't come\?/);
});

test("no match lists what can be said on this screen", async () => {
  renderScreen();
  await say("banana");
  const reply = spoken().at(-1)!;
  expect(reply).toContain("I didn't catch that. You can say:");
  expect(reply).toContain("Confirm the chest CT");
  expect(reply).toContain("I can't come");
});

test("a voice-confirmed action carries input voice, and touch input is not marked", async () => {
  renderScreen();
  expect(voiceInputMode()).toBe("touch");
  await say("confirm the chest CT");
  await say("yes");
  expect(inputDuringRun).toBe("voice");
  expect(voiceInputMode()).toBe("touch");
});

test("repeat says the last thing again", async () => {
  renderScreen();
  await say("confirm the chest CT");
  const first = spoken().at(-1);
  await say("repeat");
  expect(spoken().at(-1)).toBe(first);
});

test("a red-flag word is answered at once with the fixed safety message", async () => {
  renderScreen();
  await say("I have a fever");
  expect(spoken()[0]).toContain("112");
  expect(spoken()[0]).toContain("38");
});

test("priority content is queued before the heading and body on 'Read this page'", async () => {
  renderScreen({ heading: "Your next step", body: "Chest CT on Tuesday", priority: "Call 112 now" });
  await act(async () => voice.readPage());
  await waitFor(() => expect(spoken()).toEqual(["Call 112 now", "Your next step", "Chest CT on Tuesday"]));
});

test("Read-aloud on: the page is read on arrival; off: it stays quiet", async () => {
  const { unmount } = renderScreen({ heading: "Hello" }, { read_aloud: false });
  await act(async () => undefined);
  expect(spoken()).toEqual([]);
  unmount();
  renderScreen({ heading: "Hello" }, { read_aloud: true });
  await waitFor(() => expect(spoken()).toEqual(["Hello"]));
});

test("dictation returns the text only after a spoken yes", async () => {
  renderScreen();
  let result: string | null | undefined;
  await act(async () => {
    voice.dictate({ prompt: "Tell us in your own words" }).then((t) => (result = t));
  });
  expect(spoken()).toContain("Tell us in your own words");
  await say("my chest feels tight in the evenings");
  expect(spoken().at(-1)).toContain("my chest feels tight in the evenings");
  expect(result).toBeUndefined(); // not saved yet
  await say("yes");
  await waitFor(() => expect(result).toBe("my chest feels tight in the evenings"));
});

test("dictation answered with no returns nothing", async () => {
  renderScreen();
  let result: string | null | undefined;
  await act(async () => {
    voice.dictate({ prompt: "Say it" }).then((t) => (result = t));
  });
  await say("something");
  await say("no");
  await waitFor(() => expect(result).toBeNull());
});

test("actions are cleared when the screen unmounts", async () => {
  const { unmount } = renderScreen();
  unmount();
  await say("confirm the chest CT");
  expect(spoken().at(-1)).toContain("I didn't catch that");
  expect(screen.queryByText("screen")).toBeNull();
});
