"""Person 4. See .scratch/learn-sms-fhir-voice/spec.md → Testing Decisions.

Pure: red-flag words fi/sv/en → safety; no corpus hit → no_source; the demo question retrieves
the bronchoscopy passage.
HTTP: "What is a bronchoscopy?" → answer with source; model stubbed to fail → passage verbatim
with source.
"""
