Status: ready-for-human

# Patient companion web app

Owner: person 2 (plan section 7.3). Covers plan section 4.3, risk check + warning-sign tap, and the printable care-plan card.

## Tasks

1. Risk check screen: opt-in self-check → `POST /contacts` with `risk_check.taken = true`. Use the eligibility criteria of Finland's national lung cancer screening pilot (started January 2026, run by Oulu University Hospital): age 50–74; smokes daily now; over 15 cigarettes a day for over 25 years, or over 10 a day for over 30 years; lives in Uusimaa, Pirkanmaa, Ostrobothnia, North Ostrobothnia or Southwest Finland. Questions: age, wellbeing county, smoking status (daily now / used to / never), cigarettes a day, years smoked. Eligible → `risk_group: "screening_pilot_eligible"` and a link to the pilot's sign-up page. Anyone else → `risk_group: "not_eligible"` (or `"never_smoked"`) and the warning-sign screen, which stays open to everyone (plan section 4.1). Note: the demo persona (68, former smoker) is not eligible, because the pilot excludes people who have quit; he goes the warning-sign route. Sources disagree slightly (kaikkisyovasta.fi says "daily smoker, at least 25 years" with no cigarette count; Yle and the Cancer Society give the 15/25 and 10/30 rule), so confirm against the pilot's own sign-up page before the demo.
2. Warning-sign screen: list from Pirkanmaa's signs (plan section 4.1/§3.2) with one-tap "I have this" → `POST /contacts/{id}/warning-sign-tap`. After a tap, the other signs say a nurse calls within 1–2 working days; "Coughing up blood" instead says to seek care today (it grades red, issue 04).
3. Home (wireframe 3): greeting, one status line ("Your tests are going as planned" or "running late, Nurse Aino knows"), the next-step card with one primary action (Confirm appointment) and a "How to get there and what to bring" link, the Nurse Aino card with a call button, and a "Report a symptom" button. No phase name or day counter on patient screens. Pulls from `GET /patients/{id}` once promoted.
4. Pathway timeline: the 6-week goal ("if you need treatment, it starts within 6 weeks of your referral") and steps done/coming — derive from `phase` + `pathway_clock`.
5. Alarm-style Confirmation: slide-to-confirm UI for the 3 cases in plan section 4.3 (appointment, red-flag safety check, time-critical medication), calling `POST /escalation-steps/{id}/confirm`. "Or tap here to confirm" button under every slider.
6. Weekly Check-in: ~10 PRO-CTCAE items, one per screen with a progress bar and Previous/Next → `POST /patients/{id}/checkin`. Unscheduled reports go through the Symptom Report (task 13), not the Check-in.
7. Medication reminders: taken/skipped/side-effect in one tap → `POST /patients/{id}/medication-log`.
8. Trusted-person view: same app, different role from the fake-login screen — appointments and confirmations, can confirm, submit a Check-in and send a Symptom Report on the Patient's behalf (`actor: "trusted_person"` on the event). No clinical notes rendered, including past Check-in and Symptom Report answers.
9. Printable care-plan card: a simple print-stylesheet view of the next-step card.
10. Bottom nav (Home, Pathway, Medicines, Learn) on every companion screen; Contacts get Learn too (phase 0–3).
11. Onboarding/settings: language, text size, high contrast, Read-aloud and Voice Mode toggles → `PATCH .../accessibility`. Build each screen so issue 06 can attach voice to it: real `<button>`/`<input>` elements with visible labels, one primary action per screen, no gesture-only controls (the slide-to-confirm also needs a button fallback).
12. Follow the spec's "Finnish context" section for every screen's content: health station, the HUS hospitals for each step, the help numbers in their spec order (112, 116 117, Nurse Aino), Suomi.fi Messages, Kanta, Kela card, and Finnish date, time and decimal formats. UI text stays in English.
13. Symptom Report (wireframes R1–R6, ADR-0006), phase 2 onward, reached from Home, Help and the trusted-person view:
    - R1 Safety Check: the 7 "right now?" items as buttons plus a "None of these" primary button, and the always-visible notice (not an emergency service, reply within 1–2 working days, 116 117 / 112). Any item → R2.
    - R2 Call now: names the item tapped, big 112 and 116 117 buttons, says Nurse Aino was also told.
    - R3 Pick a symptom: breathlessness, cough/blood, pain, fever/unwell, tired/not eating, something else. One at a time; "Add another symptom" returns here.
    - R4 Guided questions: one per screen, tap-only answers (temperature on a number pad). Questions and option ids come from issue 04's rules module, so the screen never hard-codes grading.
    - R5 Own Words: optional; "Hold to speak" first, "type instead" second, read back before saving.
    - R6 Sent: what was sent and when to phone instead of waiting. A red grade from the guided questions goes to R2, not R6.
    - Submit once at the end → `POST /patients/{id}/symptom-report`; show the screen for the returned `advice_shown`.
14. Shared shell on every companion screen: header with Read aloud, Aa (opens settings, which now holds language) and Help (opens the "Who to call" screen, wireframe 12); Back on every flow screen; bottom bar with icon + label, active tab as a filled pill. Design tokens from the canvas's design-system note.

## Acceptance

- Matches the demo script's steps 2–4 (plan section 7.2): risk check → warning-sign tap → call-back → referral flagged → unanswered SMS → trusted person confirms → check-in reports fever → red alert appears on the worklist.
- A Patient can send a yellow Symptom Report (breathlessness on stairs, getting worse, spoken Own Words) without typing, and it appears on the Worklist within one poll interval.
- Tapping any Safety Check item reaches the "Call now" screen in one tap.
- Help is one tap from every companion screen.
