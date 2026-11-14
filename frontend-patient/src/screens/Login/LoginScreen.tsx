// Owner: person 2 — design port of app/index.html (artboard "0 · Demo login").
// The brand line, the headline and the role tiles. Patient → GET /demo/identities; Support
// person → the trusted view. The two coordinator roles are shown but disabled, as in the artboard.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";
import { PROVIDER_URL } from "../../lib/providerUrl";
import { setSession } from "../../lib/session";
import { Header } from "../../shell/Header";
import { useReadable } from "../../voice/useReadable";

export function LoginScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  // The login screen sits outside the shell, so this is the only way it gets a voice.
  const readable = useMemo(() => ({ heading: t("login.title"), body: t("login.note") }), [t]);
  useReadable(readable);

  const enter = async (role: "patient" | "trusted_person") => {
    setBusy(true);
    try {
      const ids = await api.identities();
      setError(false);
      if (role === "trusted_person") {
        setSession({
          role,
          patientId: ids.patient_id ?? undefined,
          contactId: ids.contact_id ?? undefined,
          trustedPersonName: ids.trusted_person?.name ?? "Liisa Virtanen",
        });
        navigate("/trusted");
        return;
      }
      setSession({ role, patientId: ids.patient_id ?? undefined, contactId: ids.contact_id ?? undefined });
      // Every patient login retakes the initial assessment questionnaire.
      navigate("/risk-check");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-frame">
      {/* Same bar as every other screen: Read aloud, Aa (settings, incl. language), Help. */}
      <Header />
      <main className="login-page">
        <div className="login-head">
          <span className="brand">
            <Icon name="brand-mark" size={32} />
            Cancer Support
          </span>
          <h1 className="login-title">{t("login.title")}</h1>
        </div>

        <div className="role-tiles">
          <button type="button" className="role-tile" disabled={busy} onClick={() => enter("patient")}>
            <span className="role-icon"><Icon name="person" size={40} /></span>
            <span className="role-name">{t("login.patient")}</span>
            <Icon name="chevron-right" size={28} />
          </button>
          <button type="button" className="role-tile" disabled={busy} onClick={() => enter("trusted_person")}>
            <span className="role-icon"><Icon name="helping" size={40} /></span>
            <span className="role-name">{t("login.support")}</span>
            <Icon name="chevron-right" size={28} />
          </button>
        </div>

        <a className="provider-link" href={PROVIDER_URL}>
          {t("demo.providerApp")}
          <Icon name="chevron-right" size={18} />
        </a>

        {error && <p role="alert">{t("login.error")}</p>}
        <p className="login-note">{t("login.note")}</p>
      </main>
    </div>
  );
}
