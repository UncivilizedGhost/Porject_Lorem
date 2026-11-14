# Alert and Escalation Step are separate mechanisms, not one

**Status:** accepted

The worklist surfaces two kinds of event that look similar at a glance — the red/yellow/green symptom Alert (plan section 4.4) and the day 0/2/3/5/7 Escalation Step (plan section 4.2) — but they have different triggers (symptom severity vs. time since an unconfirmed message), different routing rules, and different lifecycles: an Alert resolves on nurse acknowledgment, an Escalation Step resolves on Confirmation or by reaching its final rung. We modelled them as two distinct collections/event types rather than one `Alert` with a `kind` field, so each keeps its own severity/threshold logic without unused fields.

**Consequences:** the worklist query merges two collections (`alerts`, `escalation_steps`) into one sorted view rather than reading a single table.
