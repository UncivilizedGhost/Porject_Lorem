# frontend-patient

The companion: a phone web app for Contacts, Patients and Trusted People.
React + Vite + TypeScript, Vitest + Testing Library.

Spec: `.scratch/patient-companion/spec.md` (person 2). Person 4 owns `src/voice/` and
`src/screens/Learn/` inside this app (`.scratch/learn-sms-fhir-voice/spec.md`).

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api → http://localhost:8000
npm test
```

`legacy/care-companion.html` is the pre-wireframe static prototype. It is superseded, kept
out of the build, and its look is not ported.

## Layout

```
src/
  App.tsx            routes
  api/               client.ts wraps fetch (tests mock here); types.ts mirrors the data contract
  lib/               format.ts (Finnish formats), session.ts (role + id)
  styles/            tokens.css (design-system note), global.css, print.css
  shell/             AppShell = DemoBar · Header (Read aloud · Aa · Help · Back) · content · hold-to-talk slot · BottomNav
  components/        SlideToConfirm, NumberPad, ProgressBar, ChoiceList, HelpNumbers
  voice/             person 4: VoiceProvider, action registration, matcher, Read-aloud, HoldToTalkButton
  screens/           one folder per artboard; flows (RiskCheck, CheckIn, SymptomReport) hold their steps
```

Rules for every control (so Voice Mode can drive it): real `<button>` / `<input>` with a visible
label, one primary action per screen, no gesture-only control.
