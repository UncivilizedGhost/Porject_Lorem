// Owner: person 2 — alarm-style slide-to-confirm (pointer events, keyboard-operable) with a real
// <button> "Or tap here to confirm" under it. Used only for the three alarm cases.
// The thumb is 56 px wide inside a 56 px-high track, so its travel is track width minus its own
// width: it must stop flush with the right edge instead of sliding its full width out of view.
import { useCallback, useEffect, useRef, useState } from "react";

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
  const thumb = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [travel, setTravel] = useState(0);
  const [draggingNow, setDraggingNow] = useState(false);
  const dragging = useRef(false);

  const measure = useCallback(() => {
    const el = track.current;
    const th = thumb.current;
    if (!el || !th) return;
    setTravel(Math.max(1, el.clientWidth - th.offsetWidth));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const finish = (v: number) => {
    if (v >= DONE_AT) onConfirm();
    setValue(0);
  };
  const move = (clientX: number) => {
    const el = track.current;
    const th = thumb.current;
    if (!el || !th) return;
    const max = el.clientWidth - th.offsetWidth;
    if (max <= 0) return;
    // Follow the thumb's centre, not its left edge, so the pointer stays under it.
    const x = clientX - el.getBoundingClientRect().left - el.clientLeft - th.offsetWidth / 2;
    setValue(Math.max(0, Math.min(100, (x / max) * 100)));
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
        data-dragging={draggingNow || undefined}
        tabIndex={0}
        onPointerDown={(e) => {
          if (disabled) return;
          dragging.current = true;
          setDraggingNow(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          setDraggingNow(false);
          finish(value >= 90 ? DONE_AT : value);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDraggingNow(false);
          setValue(0);
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
        <span
          ref={thumb}
          className="slide-thumb"
          style={{ left: `${(value / 100) * travel}px` }}
          aria-hidden="true"
        >
          →
        </span>
        <span className="slide-hint" style={{ opacity: 1 - value / 120 }} aria-hidden="true">
          {t("confirm.slide")}
        </span>
      </div>
      <button type="button" className="primary" disabled={disabled} onClick={onConfirm}>
        {t("confirm.tap")}
      </button>
    </div>
  );
}
