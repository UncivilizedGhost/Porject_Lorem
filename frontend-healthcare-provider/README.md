# frontend-healthcare-provider

The Coordinator Worklist, the Equity Dashboard and the simulated SMS / FHIR log.
React + Vite + TypeScript, Vitest + Testing Library. Desktop page (1280–1440) that still
stacks at phone width.

Owners: person 1 builds the shell (login, demo bar, routing) and `src/features/dashboard/`
(`.scratch/equity-dashboard/spec.md`); person 3 mounts `src/features/worklist/`
(`.scratch/coordinator-worklist/spec.md`); person 4 mounts `src/features/simlog/`
(`.scratch/learn-sms-fhir-voice/spec.md`).

```bash
npm install
npm run dev        # http://localhost:5174, proxies /api → http://localhost:8000
npm test
```

## Layout

```
src/
  App.tsx              routes: / login · /worklist · /dashboard · /dashboard/county/:name
                       · /dashboard/county/:name/insight/:cardSlug · /sim-log
  api/                 client.ts wraps fetch (tests mock here); types.ts mirrors the contract
  lib/                 format.ts (Finnish formats), usePolling.ts, session.ts
  styles/              tokens.css (dashboard tokens, separate from the patient design system)
  shell/               AppShell, DemoBar, LoginScreen
  features/dashboard/  person 1: NationalOverview, CountyView, InsightCard + components
  features/worklist/   person 3: WorklistScreen, WorklistRow, SymptomReportCard (R7), Booking (stretch)
  features/simlog/     person 4: SimLogScreen
```

Charts follow the `dataviz` skill: lightness-distinct bands, a legend, labelled axes.
Every number, map, breakdown, Cause Code and simulation carries a "Synthetic" badge.
