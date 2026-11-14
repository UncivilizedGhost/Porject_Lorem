// Shown on Patient-only screens while the signed-in person is still a Contact: no pathway until
// the nurse's call-back (or the Coordinator) starts one.
import { useI18n } from "../i18n/LanguageProvider";

export function NoPathwayYet() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t("noPathway.title")}</h1>
      <p>{t("noPathway.body")}</p>
    </section>
  );
}
