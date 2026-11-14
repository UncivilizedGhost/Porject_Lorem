// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "12 · Who to call (Help, every screen)")
// Matches frontend-patient/app/help.html: ranked 112 → 116 117 → Nurse Aino → Report a symptom.
import { HelpNumbers } from "../../components/HelpNumbers";
import { useReadable } from "../../voice/useReadable";

const readable = {
  heading: "Who to call",
  priority: "In an emergency call 112. If you suddenly feel much worse, call 116 117.",
};

export function HelpScreen() {
  useReadable(readable);
  return (
    <section className="help-screen">
      <div className="help-heading">
        <h1 className="help-title">Who to call</h1>
        <p className="help-sub">Pick the one that matches how you feel right now.</p>
      </div>
      <HelpNumbers />
      <p className="help-note">
        If you are not sure, call 116 117. They will tell you what to do next.
      </p>
    </section>
  );
}
