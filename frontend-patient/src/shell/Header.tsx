// Owner: person 2 — header on every companion screen: Read aloud · Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens.
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useVoice } from "../voice/VoiceProvider";
import { useVoiceActions } from "../voice/useVoiceActions";
import { BackButton } from "./BackButton";

export function Header() {
  const { readPage } = useVoice();
  const actions = useMemo(
    () => [{ id: "header:read", label: "Read aloud", synonyms: ["read this page"], run: readPage }],
    [readPage],
  );
  useVoiceActions(actions);
  return (
    <header className="app-header">
      <BackButton />
      <button type="button" onClick={readPage}>Read aloud</button>
      <Link to="/settings" aria-label="Text size and settings">Aa</Link>
      <Link to="/help">Help</Link>
    </header>
  );
}
