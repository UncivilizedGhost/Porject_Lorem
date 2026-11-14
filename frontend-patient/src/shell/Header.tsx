// Owner: person 2 — header on every companion screen: Read aloud · Aa (settings, incl. language)
// · Help ("Who to call", one tap from everywhere). Back on flow screens.
// TODO: wire "Read this page" to the voice layer's readAloud(); Aa → /settings; Help → /help.
import { BackButton } from "./BackButton";

export function Header() {
  return (
    <header className="app-header">
      <BackButton />
      <button type="button">Read aloud</button>
      <button type="button" aria-label="Text size and settings">Aa</button>
      <button type="button">Help</button>
    </header>
  );
}
