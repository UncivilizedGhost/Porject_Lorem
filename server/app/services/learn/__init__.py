"""Learn pipeline (plan section 4.6). Owner: person 4.

ask(question, language) → { kind: safety | no_source | answer, text, sources }
1. red_flags.contains(question) → fixed safety message
2. retrieval.search(question, language) empty → "ask your nurse" + Nurse Aino's number
3. nemotron rephrases only the retrieved passages; failure → best passage verbatim with source
"""
