// Owner: person 2 — the "How to get there and what to bring" pop-up on Home: the next step's
// what_to_bring list, the HSL journey planner, and one tap to order a Kela taxi.
import { useEffect, useRef } from "react";

import type { NextStep } from "../../api/types";
import { Icon } from "../../components/Icon";
import { useI18n } from "../../i18n/LanguageProvider";

/** Demo number for the regional Kela taxi order line; swap for the real Western Uusimaa number. */
export const KELA_TAXI_PHONE = "+358800000000";
const HSL_PLANNER = "https://reittiopas.hsl.fi/";

export function GettingThereSheet({ next, onClose }: { next: NextStep; onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="getting-there-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="getting-there-title">{t("card.howToGetThere")}</h2>
        <p className="next-where">{next.where}</p>

        <h3>{t("getThere.transitTitle")}</h3>
        <p>{t("getThere.transitBody", { where: next.where })}</p>
        <a className="text-link" href={HSL_PLANNER} target="_blank" rel="noreferrer">
          {t("getThere.transitLink")}
          <Icon name="chevron-right" size={20} />
        </a>

        <h3>{t("getThere.taxiTitle")}</h3>
        <p>{t("getThere.taxiBody")}</p>
        <a className="primary" href={`tel:${KELA_TAXI_PHONE}`}>
          <Icon name="phone" size={22} />
          {t("getThere.taxiCall")}
        </a>

        {next.what_to_bring.length > 0 && (
          <>
            <h3>{t("card.bring")}</h3>
            <ul>
              {next.what_to_bring.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </>
        )}

        <button ref={closeRef} type="button" onClick={onClose}>{t("common.close")}</button>
      </section>
    </div>
  );
}
