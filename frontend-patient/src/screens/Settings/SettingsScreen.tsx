// Owner: person 2 — .scratch/patient-companion/spec.md (artboard "10 · Accessibility settings")
// Language fi/sv/en, text size M/L/XL, high contrast, Read-aloud, Voice Mode →
// PATCH /contacts|patients/{id}/accessibility (partial) and data attributes on <html>.
import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Accessibility, Language, TextSize } from "../../api/types";
import { applyAccessibility } from "../../lib/applyAccessibility";
import { getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";

const DEFAULTS: Accessibility = { read_aloud: false, voice_mode: false, text_size: "m", high_contrast: false };
const LANGUAGES: { id: Language; label: string }[] = [
  { id: "fi", label: "Suomi" },
  { id: "sv", label: "Svenska" },
  { id: "en", label: "English" },
];
const SIZES: { id: TextSize; label: string }[] = [
  { id: "m", label: "M" },
  { id: "l", label: "L" },
  { id: "xl", label: "XL" },
];

export function SettingsScreen() {
  const session = getSession();
  const kind = session?.patientId ? "patients" : "contacts";
  const id = session?.patientId ?? session?.contactId ?? "";
  const [settings, setSettings] = useState<Accessibility>(DEFAULTS);
  const [language, setLanguage] = useState<Language>("en");
  const [error, setError] = useState(false);
  const readable = useMemo(() => ({ heading: "Settings", body: "Language, text size and contrast." }), []);
  useReadable(readable);

  useEffect(() => {
    const load = kind === "patients" ? api.getPatient(id) : api.getContact(id);
    load
      .then((r) => {
        setSettings(r.accessibility);
        setLanguage(r.language);
        applyAccessibility(r.accessibility);
      })
      .catch(() => undefined);
  }, [kind, id]);

  const save = async (patch: Partial<Accessibility> & { language?: Language }) => {
    const { language: lang, ...access } = patch;
    if (lang) setLanguage(lang);
    const next = { ...settings, ...access };
    setSettings(next);
    applyAccessibility(next);
    try {
      await api.patchAccessibility(kind, id, patch);
      setError(false);
    } catch {
      setError(true);
    }
  };

  return (
    <section>
      <h1>Settings</h1>
      <fieldset>
        <legend>Language</legend>
        {LANGUAGES.map((l) => (
          <label key={l.id}>
            <input type="radio" name="language" checked={language === l.id} onChange={() => save({ language: l.id })} />
            {l.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Text size</legend>
        {SIZES.map((s) => (
          <label key={s.id}>
            <input type="radio" name="text-size" checked={settings.text_size === s.id} onChange={() => save({ text_size: s.id })} />
            {s.label}
          </label>
        ))}
      </fieldset>
      <label>
        <input type="checkbox" checked={settings.high_contrast} onChange={(e) => save({ high_contrast: e.target.checked })} />
        High contrast
      </label>
      <label>
        <input type="checkbox" checked={settings.read_aloud} onChange={(e) => save({ read_aloud: e.target.checked })} />
        Read aloud on every screen
      </label>
      <label>
        <input type="checkbox" checked={settings.voice_mode} onChange={(e) => save({ voice_mode: e.target.checked })} />
        Voice Mode (speak instead of tapping)
      </label>
      {error && <p role="alert">Your choice is shown here but could not be saved. Please try again.</p>}
    </section>
  );
}
