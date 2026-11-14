import type { Accessibility } from "../api/types";

/** Text size and contrast switch the CSS variables in styles/tokens.css via data attributes. */
export function applyAccessibility(a: Pick<Accessibility, "text_size" | "high_contrast">): void {
  document.documentElement.dataset.textSize = a.text_size;
  document.documentElement.dataset.contrast = a.high_contrast ? "high" : "normal";
}
