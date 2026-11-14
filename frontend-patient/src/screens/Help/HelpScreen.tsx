// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "12 · Who to call (Help, every screen)")
// <HelpNumbers /> ranked 112 → 116 117 → Nurse Aino → Report a symptom.
import { HelpNumbers } from "../../components/HelpNumbers";
import { useReadable } from "../../voice/useReadable";

const readable = {
  heading: "Who to call",
  priority: "In an emergency call 112. If you suddenly feel much worse, call 116 117.",
};

export function HelpScreen() {
  useReadable(readable);
  return (
    <section>
      <h1>Who to call</h1>
      <p>The most urgent is first.</p>
      <HelpNumbers />
    </section>
  );
}
