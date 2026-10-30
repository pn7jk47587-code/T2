import { SHIELDS } from "./shields";

/** Wappenformen als CSS-Masken bereitstellen (--shield-<id>). */
export function installShields() {
  const r = document.documentElement.style;
  for (const sh of SHIELDS) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120' preserveAspectRatio='none'><path d='${sh.d}'/></svg>`;
    r.setProperty(`--shield-${sh.id}`, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  }
}
