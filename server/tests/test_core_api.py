"""Person 3, seam 1 (HTTP). See .scratch/coordinator-worklist/spec.md → Testing Decisions.

- POST /contacts → promote → GET /patients/{id} round-trips
- fresh unconfirmed Patient advanced 7 times fires all five rungs in order; a Confirmation on
  day 1 stops later rungs
- Check-in 38,6 °C during treatment → red band-1 row "Call now"
- a Trusted Person's Check-in grades the same and carries "reported by"
- second Symptom Report on the same open symptom appends (one row, two trigger_event_ids)
- "coughing up blood" tap → red row; any other sign → call-back row
- acknowledge is idempotent; acknowledged row stays until mark_done
- server ignores client-sent grade / rule / advice_shown
"""
