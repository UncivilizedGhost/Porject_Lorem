// Owner: person 4 — what every screen calls (person 2 registers): actions are cleared on unmount.
// Until the layer lands this is a working no-op, so screens never wait on it.
import { useEffect } from "react";

import type { VoiceAction } from "./types";
import { useVoice } from "./VoiceProvider";

export function useVoiceActions(actions: VoiceAction[]) {
  const { registerActions } = useVoice();
  useEffect(() => registerActions(actions), [registerActions, actions]);
}
