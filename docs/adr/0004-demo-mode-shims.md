# Demo-mode shims replace real integrations for the 8-hour build

**Status:** accepted

Several of the plan's real-world integrations aren't buildable, or worth building, in 8 hours: the Escalation Step ladder's real-time day 0/2/3/5/7 timing, Suomi.fi/Omapolku login, the SMS gateway, and Kanta/FHIR sync. Each is replaced with a clearly labelled shim that preserves the rule logic a real deployment would use: a manual "advance day" control re-evaluates Alert and Escalation Step rules without waiting on a real clock; a fake login screen offers preset demo identities with no credential check; "send SMS" and "sync to Kanta" write a timestamped, UI-visible "(simulated)" log entry instead of calling a real provider. Shims were chosen over real integrations because none of them is the thing being demoed — the pathway logic is — and because real SMS/Atlas-network/eID integration risk (trial accounts, allowlists, OAuth flows) is disproportionate to a 2-minute demo script.

**Consequences:** nothing built here is production-ready; flag these explicitly before any real deployment conversation, so a later reader doesn't mistake `advance_day` or the mocked SMS/FHIR log for real scheduling or integration.
