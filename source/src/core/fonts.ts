/** Überschriftenschrift: Unifraktur Cook (lokal eingebunden). */
export function applyFont() {
  const r = document.documentElement.style;
  r.setProperty("--font-display", "'UnifrakturCook', Georgia, serif");
  r.setProperty("--head-weight", "700");
}
