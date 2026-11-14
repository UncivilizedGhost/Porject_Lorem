// Owner: person 4 — provider at the app root: language, read_aloud, voice_mode, speed from the
// person's accessibility settings; the current screen's registered actions; the "voice context"
// flag the API client reads to set input: "voice".
import { createContext, type ReactNode, useContext } from "react";

import type { Readable, VoiceAction } from "./types";

interface VoiceContextValue {
  registerActions: (actions: VoiceAction[]) => () => void;
  setReadable: (r: Readable) => void;
  readPage: () => void;
  dictate: (opts: { prompt: string }) => Promise<string | null>;
}

const noop: VoiceContextValue = {
  registerActions: () => () => undefined,
  setReadable: () => undefined,
  readPage: () => undefined,
  dictate: async () => null,
};

const VoiceContext = createContext<VoiceContextValue>(noop);

let runningVoiceAction = false;

/** Read by api/client.ts on every write. */
export function voiceInputMode(): "touch" | "voice" {
  return runningVoiceAction ? "voice" : "touch";
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  // TODO(person 4): hold actions in a ref, run the matcher on STT transcripts, read back,
  // wait for "yes", set runningVoiceAction around action.run(), red-flag safety message.
  return <VoiceContext.Provider value={noop}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  return useContext(VoiceContext);
}
