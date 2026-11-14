// Owner: person 4 — seam 3: Read-aloud player with /voice/tts mocked.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("./voiceApi", () => ({ fetchTts: vi.fn(), fetchStt: vi.fn() }));

import { readingOrder, speak, stopSpeaking } from "./readAloud";
import { fetchTts } from "./voiceApi";

const played: string[] = [];
const utterances: { text: string; lang: string; rate: number }[] = [];
const cancel = vi.fn();

class FakeAudio {
  static instances: FakeAudio[] = [];
  onended: (() => void) | null = null;
  paused = false;
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
  play() {
    played.push(this.src);
    queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  lang = "";
  rate = 1;
  constructor(public text: string) {}
}

beforeEach(() => {
  played.length = 0;
  utterances.length = 0;
  FakeAudio.instances = [];
  cancel.mockReset();
  vi.mocked(fetchTts).mockReset();
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", {
    speak: (u: FakeUtterance) => {
      utterances.push({ text: u.text, lang: u.lang, rate: u.rate });
      queueMicrotask(() => u.onend?.());
    },
    cancel,
  });
  URL.createObjectURL = vi.fn(() => "blob:server-audio");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

test("plays the server audio when the voice service answers", async () => {
  vi.mocked(fetchTts).mockResolvedValue(new Blob(["mp3"]));
  await speak("Hei", "fi", "normal");
  expect(fetchTts).toHaveBeenCalledWith("Hei", "fi", "normal");
  expect(played).toEqual(["blob:server-audio"]);
  expect(utterances).toEqual([]);
});

test("a 503 from the voice service falls back to the browser's speech in the same language", async () => {
  vi.mocked(fetchTts).mockResolvedValue(null);
  await speak("Hej", "sv", "normal");
  expect(played).toEqual([]);
  expect(utterances).toEqual([{ text: "Hej", lang: "sv-SE", rate: 1 }]);
});

test("a network failure also falls back, and slow speed slows the browser voice", async () => {
  vi.mocked(fetchTts).mockRejectedValue(new Error("offline"));
  await speak("Hello", "en", "slow");
  expect(utterances).toEqual([{ text: "Hello", lang: "en-GB", rate: 0.8 }]);
});

test("stopSpeaking silences audio and the browser voice", async () => {
  let release!: (b: Blob) => void;
  vi.mocked(fetchTts).mockReturnValue(new Promise((r) => (release = r)));
  const done = speak("Hei", "fi", "normal");
  stopSpeaking();
  release(new Blob(["mp3"]));
  await done;
  expect(cancel).toHaveBeenCalled();
  expect(played).toEqual([]); // stopped before the audio arrived: it never starts
});

test("priority content is read before the heading, and the heading before the body", () => {
  expect(readingOrder({ body: "Body", heading: "Heading", priority: "Call 112" })).toEqual([
    "Call 112",
    "Heading",
    "Body",
  ]);
  expect(readingOrder({ heading: "Only heading" })).toEqual(["Only heading"]);
});
