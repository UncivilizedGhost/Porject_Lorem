// Owner: person 2 — artboard "10 · Accessibility settings" (app/accessibility.html),
// "Make it easier to use". Language, reading speed, text size and three switches, as tappable
// tiles: the whole card is the control, with a check mark that fills when chosen.
// Language + the four Accessibility fields are PATCHed to the Contact or Patient record one key
// at a time; the data attributes on <html> change the page immediately.
import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Accessibility, Language, TextSize } from "../../api/types";
import { useI18n } from "../../i18n/LanguageProvider";
import { applyAccessibility } from "../../lib/applyAccessibility";
import { getSession } from "../../lib/session";
import { useReadable } from "../../voice/useReadable";
import { useVoice } from "../../voice/VoiceProvider";
import { useVoiceActions } from "../../voice/useVoiceActions";

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
type ReadingSpeed = "normal" | "slow";
type Target = { kind: "patients" | "contacts"; id: string };

/** The record these settings belong to, taken from the demo session. */
function targetFromSession(): Target | null {
  const s = getSession();
  if (s?.patientId) return { kind: "patients", id: s.patientId };
  if (s?.contactId) return { kind: "contacts", id: s.contactId };
  return null;
}

/** Recovery for an empty session, or for an id a demo reset removed: ask the demo identity
 * endpoint for the current record. It deliberately does not write a session — this screen is
 * reachable from the login page's header, and opening it must not choose a role for the person. */
async function refreshTarget(): Promise<Target> {
  const ids = await api.identities();
  if (ids.patient_id) return { kind: "patients", id: ids.patient_id };
  if (ids.contact_id) return { kind: "contacts", id: ids.contact_id };
  throw new Error("no demo identity");
}

/** Small SVG flags instead of emoji: flag emoji do not render on Windows. */
function FlagIcon({ code }: { code: Language }) {
  if (code === "fi") {
    return (
      <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
        <rect width="30" height="20" fill="#ffffff" />
        <rect x="9" y="0" width="4" height="20" fill="#002F6C" />
        <rect x="0" y="8" width="30" height="4" fill="#002F6C" />
      </svg>
    );
  }
  if (code === "sv") {
    return (
      <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
        <rect width="30" height="20" fill="#006AA7" />
        <rect x="9" y="0" width="4" height="20" fill="#FECC02" />
        <rect x="0" y="8" width="30" height="4" fill="#FECC02" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" focusable="false">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="2" />
      <rect x="12" y="0" width="6" height="20" fill="#ffffff" />
      <rect x="0" y="7" width="30" height="6" fill="#ffffff" />
      <rect x="13.5" y="0" width="3" height="20" fill="#C8102E" />
      <rect x="0" y="8.5" width="30" height="3" fill="#C8102E" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path d="M10 6l13 9-13 9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlowIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path
        d="M8 5h14M8 25h14M10 5c0 6 5 7 5 10s-5 4-5 10M20 5c0 6-5 7-5 10s5 4 5 10"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <path
        d="M15 4a4 4 0 014 4v6a4 4 0 01-8 0V8a4 4 0 014-4zM8 14a7 7 0 0014 0M15 21v5"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ContrastIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 4a11 11 0 000 22z" fill="currentColor" />
    </svg>
  );
}

function CheckDot({ on }: { on: boolean }) {
  return on ? (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.5 3.5 6.5-7" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** One tappable card; the real input covers it, so keyboard and screen readers behave normally. */
function Opt({
  children,
  selected,
  className = "",
}: {
  children: React.ReactNode;
  selected: boolean;
  className?: string;
}) {
  return (
    <label className={`opt ${className}`.trim()} data-selected={selected}>
      {children}
    </label>
  );
}

export function SettingsScreen() {
  const initial = useMemo(targetFromSession, []);
  const [kind, setKind] = useState<Target["kind"]>(initial?.kind ?? "patients");
  const [id, setId] = useState(initial?.id ?? "");
  // The Language tiles are the app-wide switch: they set the page language (and the voice
  // layer's language) immediately, then save the choice to the record.
  const { language, setLanguage, t } = useI18n();
  const { updateSettings } = useVoice();
  const [settings, setSettings] = useState<Accessibility>(DEFAULTS);
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>("slow");
  const [error, setError] = useState(false);

  const readable = useMemo(
    () => ({ heading: t("settings.title"), body: t("settings.readBody") }),
    [t],
  );
  useReadable(readable);

  useEffect(() => {
    let cancelled = false;
    // Opened without signing in: adopt the current demo record instead of loading nothing.
    if (!id) {
      refreshTarget()
        .then((t) => {
          if (cancelled) return;
          setKind(t.kind);
          setId(t.id);
        })
        .catch(() => undefined);
      return () => { cancelled = true; };
    }
    const load = kind === "patients" ? api.getPatient(id) : api.getContact(id);
    load
      .then((r) => {
        if (cancelled) return;
        setSettings(r.accessibility);
        setLanguage(r.language);
        updateSettings({ language: r.language });
        applyAccessibility(r.accessibility);
        document.documentElement.lang = r.language;
      })
      .catch(() => {
        // The stored session can outlive a demo reset; follow the current demo identity once.
        refreshTarget()
          .then((t) => {
            if (cancelled || t.id === id) return;
            setKind(t.kind);
            setId(t.id);
          })
          .catch(() => undefined);
      });
    return () => { cancelled = true; };
  }, [kind, id]);

  const save = async (patch: Partial<Accessibility> & { language?: Language }) => {
    const { language: lang, ...access } = patch;
    if (lang) {
      setLanguage(lang);
      updateSettings({ language: lang });
      document.documentElement.lang = lang;
    }
    const next = { ...settings, ...access };
    setSettings(next);
    applyAccessibility(next);
    const write = (t: Target) => api.patchAccessibility(t.kind, t.id, patch);
    try {
      const t: Target = id ? { kind, id } : await refreshTarget();
      await write(t);
      if (!id) {
        setKind(t.kind);
        setId(t.id);
      }
      setError(false);
    } catch {
      // No session, or an id the server no longer has: ask for the current demo record once.
      try {
        const fresh = await refreshTarget();
        await write(fresh);
        setKind(fresh.kind);
        setId(fresh.id);
        setError(false);
      } catch {
        setError(true);
      }
    }
  };

  const actions = useMemo(
    () => [
      ...LANGUAGES.map((l) => ({ id: `settings:lang:${l.id}`, label: l.label, run: () => { void save({ language: l.id }); } })),
      ...SIZES.map((s) => ({ id: `settings:size:${s.id}`, label: t("settings.textSize", { size: s.label }), run: () => { void save({ text_size: s.id }); } })),
      { id: "settings:voice_mode", label: t("settings.voiceMode"), run: () => { void save({ voice_mode: !settings.voice_mode }); } },
      { id: "settings:contrast", label: t("settings.contrast"), run: () => { void save({ high_contrast: !settings.high_contrast }); } },
    ],
    // save closes over `settings`; re-register when the record changes.
    [settings, t], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useVoiceActions(actions);

  return (
    <section className="settings">
      <h1>{t("settings.title")}</h1>

      <fieldset className="opt-fieldset">
        <legend>{t("settings.language")}</legend>
        <div className="opt-grid cols-3">
          {LANGUAGES.map((l) => (
            <Opt key={l.id} selected={language === l.id}>
              <input
                type="radio"
                name="language"
                checked={language === l.id}
                onChange={() => save({ language: l.id })}
              />
              <span className="opt-icons">
                <span className="opt-icon opt-flag"><FlagIcon code={l.id} /></span>
                <span className="opt-check"><CheckDot on={language === l.id} /></span>
              </span>
              <span className="opt-label">{l.label}</span>
            </Opt>
          ))}
        </div>
      </fieldset>

      <fieldset className="opt-fieldset">
        <legend>{t("settings.readingSpeed")}</legend>
        <div className="opt-grid cols-2">
          {([
            { id: "normal" as ReadingSpeed, label: t("settings.normal"), icon: <PlayIcon /> },
            { id: "slow" as ReadingSpeed, label: t("settings.slow"), icon: <SlowIcon /> },
          ]).map((s) => (
            <Opt key={s.id} selected={readingSpeed === s.id}>
              <input
                type="radio"
                name="reading-speed"
                checked={readingSpeed === s.id}
                onChange={() => setReadingSpeed(s.id)}
              />
              <span className="opt-icons">
                <span className="opt-icon">{s.icon}</span>
                <span className="opt-check"><CheckDot on={readingSpeed === s.id} /></span>
              </span>
              <span className="opt-label">{s.label}</span>
            </Opt>
          ))}
        </div>
      </fieldset>

      <fieldset className="opt-fieldset">
        <legend>{t("settings.appearance")}</legend>
        <div className="opt-grid cols-3">
          {SIZES.map((s) => (
            <Opt key={s.id} selected={settings.text_size === s.id} className={`text-size preview-${s.id}`}>
              <input
                type="radio"
                name="text-size"
                aria-label={s.label}
                checked={settings.text_size === s.id}
                onChange={() => save({ text_size: s.id })}
              />
              <span className="opt-icons">
                <span className="opt-check"><CheckDot on={settings.text_size === s.id} /></span>
              </span>
              <span className="opt-preview" aria-hidden="true">Aa</span>
            </Opt>
          ))}
        </div>
      </fieldset>

      <div className="opt-grid cols-2">
        <Opt selected={settings.voice_mode} className="toggle">
          <input
            type="checkbox"
            aria-label={t("settings.voiceMode")}
            checked={settings.voice_mode}
            onChange={(e) => save({ voice_mode: e.target.checked })}
          />
          <span className="opt-icons">
            <span className="opt-icon"><MicIcon /></span>
            <span className="opt-check"><CheckDot on={settings.voice_mode} /></span>
          </span>
          <span className="opt-label">{t("settings.voiceOn")}</span>
        </Opt>

        <Opt selected={settings.high_contrast} className="toggle">
          <input
            type="checkbox"
            aria-label={t("settings.contrast")}
            checked={settings.high_contrast}
            onChange={(e) => save({ high_contrast: e.target.checked })}
          />
          <span className="opt-icons">
            <span className="opt-icon"><ContrastIcon /></span>
            <span className="opt-check"><CheckDot on={settings.high_contrast} /></span>
          </span>
          <span className="opt-label">{t("settings.contrastOn")}</span>
        </Opt>
      </div>

      {error && (
        <p className="error" role="alert">
          {t("settings.error")}
        </p>
      )}

      <span className="settings-note">{t("settings.note")}</span>
    </section>
  );
}
