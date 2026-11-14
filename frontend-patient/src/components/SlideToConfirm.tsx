// Owner: person 2 — alarm-style slide-to-confirm (pointer events, keyboard-operable) with a real
// <button> "Or tap here to confirm" under it. Used only for the three alarm cases.
import { useRef, useState } from "react";

import { useI18n } from "../i18n/LanguageProvider";

interface Props {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}

const KEY_STEP = 25;
const DONE_AT = 100;

export function SlideToConfirm({ label, onConfirm, disabled = false }: Props) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const dragging = useRef(false);

  const finish = (v: number) => {
    if (v >= DONE_AT) onConfirm();
    setValue(0);
  };
  const move = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setValue(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div className="slide-to-confirm">
      <div
        ref={track}
        className="slide-track"
        role="slider"
        aria-label={`${t("confirm.slide")}: ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-disabled={disabled}
        tabIndex={0}
        onPointerDown={(e) => {
          if (disabled) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          finish(value >= 90 ? DONE_AT : value);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "End") finish(DONE_AT);
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            const next = Math.min(DONE_AT, value + KEY_STEP);
            if (next >= DONE_AT) finish(DONE_AT);
            else setValue(next);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "Home") setValue(0);
        }}
      >
        <span className="slide-thumb" style={{ left: `${value}%` }} aria-hidden="true">→</span>
        <span className="slide-hint" aria-hidden="true">{t("confirm.slide")}</span>
      </div>
      <button type="button" className="primary" disabled={disabled} onClick={onConfirm}>
        {t("confirm.tap")}
      </button>
    </div>
  );
}
