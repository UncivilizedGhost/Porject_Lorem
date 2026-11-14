"""Fixed red-flag word list in fi / sv / en, shared by Learn and (mirrored in the frontend)
Voice Mode. Triggers the safety message only; never sets or lowers a grade (ADR-0006)."""

from __future__ import annotations

from app.services.learn.text import normalize

# Stems are matched as substrings of the normalised text (no diacritics, no apostrophes), so
# Finnish inflections ("kuumetta", "kuumeen") hit. Keep in sync with frontend-patient/src/voice/redFlags.ts.
RED_FLAG_WORDS: dict[str, list[str]] = {
    "fi": [
        "kuume",
        "verta",
        "veri",
        "veres",
        "verin",
        "en saa henkea",
        "hengenahdist",
        "vaikea hengittaa",
        "rintakipu",
    ],
    "sv": [
        "feber",
        "blod",
        "kan inte andas",
        "andnod",
        "brostsmarta",
    ],
    "en": [
        "fever",
        "blood",
        "bleeding",
        "cant breathe",
        "cannot breathe",
        "can not breathe",
        "short of breath",
        "difficulty breathing",
        "chest pain",
    ],
}

SAFETY_MESSAGE: dict[str, str] = {
    "fi": (
        "Tämä voi olla vaarallista. Hätätilanteessa soita 112. "
        "Neuvoa saat myös numerosta 116 117. "
        "Jos sinulla on syöpähoidon aikana yli 38 asteen kuume, mene päivystykseen heti."
    ),
    "sv": (
        "Det här kan vara farligt. Ring 112 vid akut fara. "
        "Du kan också ringa 116 117 för råd. "
        "Om du har över 38 graders feber under cancerbehandling ska du genast åka till akuten."
    ),
    "en": (
        "This could be serious. In an emergency call 112. "
        "You can also call 116 117 for advice. "
        "If you have a temperature of 38 °C or higher during cancer treatment, "
        "go to the emergency department now."
    ),
}


def contains_red_flag(text: str, language: str) -> bool:
    haystack = normalize(text)
    return any(word in haystack for word in RED_FLAG_WORDS.get(language, []))
