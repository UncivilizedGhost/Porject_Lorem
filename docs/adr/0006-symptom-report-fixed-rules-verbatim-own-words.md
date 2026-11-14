# Symptom Reports are graded by fixed rules; Own Words are stored verbatim and never grade

**Status:** accepted

Patients need a way to report something new between appointments. Every product and trial we reviewed (UKONS triage toolkit, PRO-CTCAE, Noona, Kaiku, eRAPID, the Basch trials; see `docs/research/on-demand-symptom-reporting.md`) does this the same way: structured questions graded by fixed rules, immediate fixed advice to the patient, then human review from a queue that is not watched in real time. None of them triages free text automatically, and only about a third of patient free text maps to a known symptom term. We follow that pattern:

- A Safety Check runs first, as explicit yes/no items, so a danger sign is never left sitting in free text in a queue.
- Each symptom has fixed guided questions mapped to green/yellow/red. Grades combine across symptoms by "worst wins" and "two yellows make red" (UKONS). The rules carry a version number, stored on every report.
- Own Words are optional, stored exactly as spoken or typed (after read-back for speech), and shown to the Coordinator. They never set or lower a grade, and no language model reads them.
- The patient acts on red advice themselves (call 112 / 116 117); the Worklist Alert is a backup, not the promise. Response time for yellow and green is stated as 1–2 working days, matching HUS's own Noona promise.

We rejected an AI summary or AI triage of free text: it would make the grading opaque, move the product further into EU MDR and AI Act territory, and has no precedent in the systems we reviewed. A rule-based keyword list that can only *raise* a report for earlier review stays an option.

**Consequences:** grading logic lives in one versioned rules module (issue 04) shared by Check-ins and Symptom Reports. Thresholds (e.g. 38 °C) must be signed off by a clinical owner before any real use; the hackathon values are our reading of HUS and UKONS guidance. Software that grades symptoms and gives advice is still likely a medical device, even without AI.
