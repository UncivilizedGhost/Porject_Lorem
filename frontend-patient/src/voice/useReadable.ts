// Owner: person 4 — screens mark heading / body / priority text; Read-aloud reads priority
// first, then heading, then body, on arrival (when on) and on "Read this page" (always).
import { useEffect } from "react";

import type { Readable } from "./types";
import { useVoice } from "./VoiceProvider";

export function useReadable(readable: Readable) {
  const { setReadable } = useVoice();
  useEffect(() => setReadable(readable), [setReadable, readable]);
}
