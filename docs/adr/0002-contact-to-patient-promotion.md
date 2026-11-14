# Contact-to-Patient promotion marks the start of the Pathway Clock

**Status:** accepted

A person who has only taken the risk check or tapped a warning sign (phase 0–1) is modelled as a separate, lighter `Contact` record, not a `Patient`. Promotion to `Patient` — and the start of the Pathway Clock — happens exactly at Referral (phase 2, suspected cancer flagged). We chose this over treating everyone as a Patient from first contact because the plan's own Nordic sources (section 3.2) start the clock at referral/well-founded suspicion, and because a single Patient table would accumulate records for people who were never actually referred, distorting the Equity Dashboard's denominators.

**Consequences:** any feature touching phase 0–1 people (risk check, warning-sign tap, call-back) queries Contacts, not Patients; the promotion write path is the only place a Patient document is created.
