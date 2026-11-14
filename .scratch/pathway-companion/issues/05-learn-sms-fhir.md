Status: ready-for-human

# Learn knowledge base + simulated SMS/FHIR

Owner: person 4 (plan section 7.3). Covers plan sections 4.6 and 5.

## Tasks

1. `/learn`: a question box that calls `POST /learn/ask`. Backend restricts retrieval to the allowed sources listed in plan section 4.6 (pull in a handful of their actual plain-language passages as a small local corpus — doesn't need to be exhaustive for the demo) and calls the Nemotron 3.5 Super VL endpoint already configured in `opencode.json` (`verda-nemotron` provider, key at `.secrets/verda_inference_key`) to rephrase, not to answer from its own knowledge. No source retrieved → return the fixed "ask your nurse" + number message. Red-flag words in the question → fixed pre-written safety message, not a generated answer.
2. Run the ~50-question quality check from plan section 4.6 informally against whoever's available to play "clinician" — at minimum sanity-check 8–10 questions before the demo, not the full 50, given the time budget.
3. Simulated SMS: whenever another role's code would send an SMS (warning-sign call-back, escalation rung, appointment confirmation), call a shared `send_sms(to, text)` helper that just writes an `events` row with `type: "sms_sent"` and a `(simulated)` flag — no real provider (ADR-0004). Surface these as a visible log somewhere (even a `/sms-log` debug page) so the demo can point at "a message went out" without faking a real phone.
4. Simulated FHIR: a `fhir_sync` event type written the same way, with a mocked FHIR-shaped payload (e.g. a minimal `Bundle` with one `Observation`) attached — labelled in the UI as a mock-up per plan section 5 ("steps 3–5 are labelled FHIR mock-ups").

## Acceptance

- Asking "What is a bronchoscopy?" in `/learn` returns a plain-Finnish-or-English answer with a visible source, matching demo script step 5.
- Every simulated SMS/FHIR action in the demo is visibly labelled "(simulated)" somewhere in the UI, so nobody mistakes it for a real integration.
