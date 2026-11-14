# Cancer Pathway Companion

Adapts Nordic cancer patient pathways to Finland's existing services, giving every person at risk of or suspected of lung cancer a clock, a next step and a named nurse — and showing decision-makers where the clock stops and for whom. MVP scope: suspected lung cancer, one demo county, risk check to first treatment cycle.

## Language

### People & roles

**Contact**:
A person who has taken the risk check or tapped a warning sign but has no referral yet — phase 0–1, no Pathway Clock, no clinical record.
_Avoid_: Patient (reserved for after promotion), User, Account.

**Patient**:
A Contact promoted at the moment a Referral is flagged (phase 2 onward) — carries a Pathway and a Pathway Clock from that point.
_Avoid_: Contact, Account, Case.

**Coordinator** (Coordinator Nurse):
The one named nurse who owns a Patient's pathway end to end and acts on the Worklist.
_Avoid_: Contact nurse, Case manager, Navigator — synonyms used by Nordic sources, not this product.

**Trusted Person** (fi *läheinen*, sv *närstående*):
Anyone the Patient chooses to involve, family or not; can view appointments and confirmations, confirm on the Patient's behalf and submit a Check-in or Symptom Report for them (all logged as proxy), never clinical notes. Patient-facing text says "someone you trust".
_Avoid_: Next of kin (family-only and formal), Caregiver (*omaishoitaja* is a formal paid status in Finland), Guardian (a court-appointed *edunvalvoja*, a separate legal role outside the MVP), Proxy (use only as the logged action type).

### Pathway & timing

**Phase**:
One of four stages a Patient's record moves through in order: Reach Out, Warning Signs, Suspected Cancer, Treatment.
_Avoid_: Stage (reserved for cancer staging, a different concept), Step.

**Referral** (Suspected-cancer flag):
The event that promotes a Contact to Patient and starts the Pathway Clock.
_Avoid_: Suspicion, Diagnosis — Referral precedes Diagnosis.

**Pathway**:
A Patient's record of progress from Referral through to the first treatment cycle, within the MVP's lung-cancer scope.
_Avoid_: Journey, Care plan, Case.

**Pathway Clock**:
The elapsed-time measure from Referral to first treatment, benchmarked against Finland's 6-week headline target and Pirkanmaa's per-phase stage warnings.
_Avoid_: Timer, SLA.

**Confirmation**:
A Patient's or Trusted Person's explicit acknowledgment of a step (slide-to-confirm) — the only action that stops the Escalation Step ladder for that step.
_Avoid_: Acknowledgment, Read receipt — a read receipt is a channel-level signal, not a Confirmation.

**Escalation Step**:
One rung (day 0, 2, 3, 5, 7) of the fixed ladder that fires when a Confirmation is overdue; triggered by elapsed time, not by symptoms.
_Avoid_: Alert, Reminder, Notification.

### Signals & responses

**Check-in**:
A Patient's scheduled weekly questionnaire (PRO-CTCAE items) during the Treatment phase, submitted by the Patient or by their Trusted Person as proxy.
_Avoid_: Survey, Assessment, Symptom Report (the unscheduled one).

**Symptom Report**:
A Patient's unscheduled report of something new, from phase 2 onward: Safety Check, then one or more symptoms with guided questions, then optional own words, graded by fixed rules. Not monitored in real time; reviewed within 1–2 working days.
_Avoid_: Chat, Message, Check-in.

**Safety Check**:
The fixed list of "right now?" danger signs that opens every Symptom Report; ticking any one stops the report and tells the person to call 112 or 116 117 themselves.
_Avoid_: Triage, Screening.

**Own Words**:
The optional free-text part of a Symptom Report, spoken or typed, stored verbatim; it is shown to the Coordinator but never sets or lowers a grade.
_Avoid_: Note, Comment, Transcript (the raw speech-to-text output before read-back).

**Alert**:
A red/yellow/green grading produced from a Check-in, a Symptom Report or a Warning Signs tap, routed by severity; triggered by symptom content, not by elapsed time.
_Avoid_: Escalation Step, Notification, Flag.

**Red Flag**:
A fixed combination of symptoms (e.g. fever during chemotherapy) that always grades an Alert red and requires named-owner acknowledgment.
_Avoid_: Emergency, Critical alert.

### Reporting

**Worklist**:
The Coordinator's single prioritised list of Patients needing action today, combining Alerts, Escalation Steps, and warning-sign call-backs.
_Avoid_: Queue, Dashboard — the Dashboard is the separate decision-maker-facing view.

**Equity Dashboard**:
The county- and national-level view of Pathway Clock performance broken down by age, language, education group and municipality type.
_Avoid_: Worklist, Report.

**County**:
A wellbeing services county (hyvinvointialue), the geographic aggregation unit for the Equity Dashboard; the City of Helsinki counts as one. The MVP uses the real names of all 21 counties plus Helsinki with synthetic figures, every figure labelled synthetic. The demo county is Western Uusimaa.
_Avoid_: Region, Area.

**Insight Card**:
The Equity Dashboard's third level: one gap (what, where, who), its Cause Codes, the Matched Actions with simulated effect ranges, and the human decision taken on it.
_Avoid_: Recommendation, Alert (a Patient-level signal on the Worklist).

**Action Library**:
The curated, hand-authored set of actions an Insight Card can show, each tied to a national strategy or roadmap action and to cited evidence with an evidence badge.
_Avoid_: Recommendations, Playbook.

**Matched Action**:
An Action Library entry whose gap pattern matches an Insight Card. The system matches; it never invents, ranks or recommends — a person decides.
_Avoid_: Recommended action, Suggested action.

**Cause Code**:
The reason days are lost at a pathway stage, aggregated per County: unconfirmed, transport, waiting for a slot. Synthetic in the MVP.
_Avoid_: Root cause, Reason (unqualified).

**Decision Log**:
The append-only record of who approved, adapted or rejected which Matched Actions on an Insight Card, when, why, with which owner, and on which numbers and evidence as shown at the time.
_Avoid_: Audit log (no production audit logging in the MVP), History.

### Accessibility

**Read-aloud**:
Text-to-speech of what is on screen, for Contacts, Patients and Trusted People with low vision or low literacy; switched on in onboarding or settings.
_Avoid_: Screen reader (the device's own assistive technology, which must keep working alongside it).

**Voice Mode**:
Operating the companion by speaking: every on-screen action can be triggered by voice, and every voice action is read back and confirmed aloud before it is sent.
_Avoid_: Voice assistant, Chatbot — Voice Mode only triggers the actions already on screen; it does not converse or decide.
