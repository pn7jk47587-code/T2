import { useId, type ReactElement } from "react";
import { getShield } from "./shields";
import type { Arms } from "./types";

/** Tinkturen (Farben und Metalle der Heraldik) */
export const TINCTURES: { id: string; name: string; hex: string }[] = [
  { id: "silber", name: "Silber", hex: "#e4e7ea" },
  { id: "gold", name: "Gold", hex: "#d2a33a" },
  { id: "rot", name: "Rot", hex: "#b3243b" },
  { id: "burgund", name: "Burgund", hex: "#6e1424" },
  { id: "blau", name: "Blau", hex: "#24477e" },
  { id: "gruen", name: "Grün", hex: "#2e6b3f" },
  { id: "purpur", name: "Purpur", hex: "#5e2a63" },
  { id: "stahl", name: "Stahl", hex: "#7a8189" },
  { id: "schwarz", name: "Schwarz", hex: "#141416" },
];
export const tincture = (id: string) => TINCTURES.find((t) => t.id === id)?.hex ?? id;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Heroldsbilder: wie die Farben auf dem Schild verteilt sind (Raster 100 x 120). */
export const DIVISIONS: { id: string; name: string; draw: (c: string, shape: string) => ReactElement | null }[] = [
  { id: "einfarbig", name: "Einfarbig", draw: () => null },
  { id: "geteilt", name: "Geteilt", draw: (c) => <rect x="0" y="60" width="100" height="60" fill={c} /> },
  { id: "gespalten", name: "Gespalten", draw: (c) => <rect x="50" y="0" width="50" height="120" fill={c} /> },
  { id: "geviert", name: "Geviert", draw: (c) => <path d="M50 0H100V60H50ZM0 60H50V120H0Z" fill={c} /> },
  { id: "schraeg", name: "Schräg geteilt", draw: (c) => <path d="M0 0L100 120H0Z" fill={c} /> },
  { id: "schraeglinks", name: "Schräglinks geteilt", draw: (c) => <path d="M100 0V120H0Z" fill={c} /> },
  { id: "schraeggeviert", name: "Schräg geviert", draw: (c) => <path d="M0 0L50 60L0 120ZM100 0L50 60L100 120Z" fill={c} /> },
  { id: "haupt", name: "Schildhaupt", draw: (c) => <rect x="0" y="0" width="100" height="38" fill={c} /> },
  { id: "fuss", name: "Schildfuß", draw: (c) => <rect x="0" y="84" width="100" height="36" fill={c} /> },
  { id: "pfahl", name: "Pfahl", draw: (c) => <rect x="36" y="0" width="28" height="120" fill={c} /> },
  { id: "balken", name: "Balken", draw: (c) => <rect x="0" y="46" width="100" height="28" fill={c} /> },
  { id: "schraegbalken", name: "Schrägbalken", draw: (c) => <rect x="-30" y="48" width="170" height="24" fill={c} transform="rotate(50 50 60)" /> },
  { id: "sparren", name: "Sparren", draw: (c) => <path d="M50 34L104 88V112L50 58L-4 112V88Z" fill={c} /> },
  { id: "kreuz", name: "Kreuz", draw: (c) => <path d="M38 0H62V48H100V72H62V120H38V72H0V48H38Z" fill={c} /> },
  { id: "andreaskreuz", name: "Andreaskreuz", draw: (c) => (
    <g fill={c}><rect x="-30" y="49" width="170" height="22" transform="rotate(50 50 60)" /><rect x="-30" y="49" width="170" height="22" transform="rotate(-50 50 60)" /></g>
  ) },
  { id: "goepel", name: "Göpel", draw: (c) => <path d="M0 0H18L50 38L82 0H100V14L61 53V120H39V53L0 14Z" fill={c} /> },
  { id: "spitze", name: "Spitze", draw: (c) => <path d="M22 0H78L50 96Z" fill={c} /> },
  { id: "bord", name: "Schildrand", draw: (c, shape) => <path d={shape} fill="none" stroke={c} strokeWidth="24" /> },
  { id: "herzschild", name: "Herzschild", draw: (c, shape) => <path d={shape} fill={c} transform="translate(50 60) scale(.46) translate(-50 -60)" /> },
  { id: "staenderung", name: "Ständerung", draw: (c) => (
    <g fill={c}>{range(4).map((k) => { const a1 = (k * 90 * Math.PI) / 180, a2 = a1 + Math.PI / 4; return <path key={k} d={`M50 60L${50 + 200 * Math.cos(a1)} ${60 + 200 * Math.sin(a1)}L${50 + 200 * Math.cos(a2)} ${60 + 200 * Math.sin(a2)}Z`} />; })}</g>
  ) },
  { id: "mehrfachgeteilt", name: "Mehrfach geteilt", draw: (c) => <g fill={c}>{[20, 60, 100].map((y) => <rect key={y} x="0" y={y} width="100" height="20" />)}</g> },
  { id: "mehrfachgespalten", name: "Mehrfach gespalten", draw: (c) => <g fill={c}>{[1, 3, 5].map((i) => <rect key={i} x={(i * 100) / 6} y="0" width={100 / 6} height="120" />)}</g> },
  { id: "geschacht", name: "Geschacht", draw: (c) => (
    <g fill={c}>{range(30).map((i) => { const x = i % 5, y = Math.floor(i / 5); return (x + y) % 2 ? <rect key={i} x={x * 20} y={y * 20} width="20" height="20" /> : null; })}</g>
  ) },
  { id: "gerautet", name: "Gerautet", draw: (c) => (
    <g fill={c}>{range(7 * 6).map((i) => { const x = (i % 7) * 20 - 10 + (Math.floor(i / 7) % 2 ? 10 : 0), y = Math.floor(i / 7) * 24; return <path key={i} d={`M${x} ${y}L${x + 10} ${y + 12}L${x} ${y + 24}L${x - 10} ${y + 12}Z`} />; })}</g>
  ) },
  { id: "zinnen", name: "Zinnenschnitt", draw: (c) => <path d="M0 60H12V48H26V60H38V48H50V60H62V48H74V60H86V48H100V120H0Z" fill={c} /> },
];

/** Gefüllte Wappenbilder im Raster 24 x 24 (gerade-ungerade Füllregel für Aussparungen). */
const sun = () => {
  let d = "M12 7.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9Z";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, b = a + 0.16, m = a + 0.08;
    d += `M${12 + 5.6 * Math.cos(a)} ${12 + 5.6 * Math.sin(a)}L${12 + 10.5 * Math.cos(m)} ${12 + 10.5 * Math.sin(m)}L${12 + 5.6 * Math.cos(b)} ${12 + 5.6 * Math.sin(b)}Z`;
  }
  return d;
};
const wheel = () => {
  let d = "M12 2.5a9.5 9.5 0 1 1 0 19a9.5 9.5 0 1 1 0-19Zm0 2.2a7.3 7.3 0 1 0 0 14.6a7.3 7.3 0 1 0 0-14.6Z M12 9.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 1 1 0-4.8Z";
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, s = 0.55, ca = Math.cos(a), sa = Math.sin(a), px = -sa * s, py = ca * s;
    d += `M${12 + 2.4 * ca + px} ${12 + 2.4 * sa + py}L${12 + 7.4 * ca + px} ${12 + 7.4 * sa + py}L${12 + 7.4 * ca - px} ${12 + 7.4 * sa - py}L${12 + 2.4 * ca - px} ${12 + 2.4 * sa - py}Z`;
  }
  return d;
};
const rose = () => {
  let d = "";
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; const x = 12 + 4.6 * Math.cos(a), y = 12.5 + 4.6 * Math.sin(a); d += `M${x} ${y - 4.2}a4.2 4.2 0 1 1 0 8.4a4.2 4.2 0 1 1 0-8.4Z`; }
  return d + "M12 9.8a2.7 2.7 0 1 1 0 5.4a2.7 2.7 0 1 1 0-5.4Z";
};
const wheat = () => {
  let d = "M11.4 9h1.2v13h-1.2Z";
  for (let k = 0; k < 4; k++) { const y = 3.5 + k * 3.2; d += `M12 ${y + 2.4}c-.4-1.8.2-3.2 1.8-4c.6 1.6.1 3.1-1.8 4Z M12 ${y + 2.4}c.4-1.8-.2-3.2-1.8-4c-.6 1.6-.1 3.1 1.8 4Z`; }
  return d + "M12 1.2c.9 1 1.1 2.2.6 3.2h-1.2c-.5-1-.3-2.2.6-3.2Z";
};

/** split: jedes Teilstück einzeln füllen, damit sich überlappende Formen nicht gegenseitig ausstanzen */
export const CHARGES: { id: string; name: string; d: string; split?: boolean }[] = [
  { id: "keins", name: "Ohne", d: "" },
  { id: "lilie", name: "Lilie", d: "M12 1.8c-1.7 2.1-2.5 4-2.5 5.8 0 1.6.9 3 2.5 4.4 1.6-1.4 2.5-2.8 2.5-4.4 0-1.8-.8-3.7-2.5-5.8Z M10.8 12.8C9.5 10.6 7.2 9.5 4.6 10.1c-.5 2.8 1.4 5 4.2 5h1.4v1.3H7.2v1.8h3c-.4 1.6-1.3 2.8-2.7 3.6h9c-1.4-.8-2.3-2-2.7-3.6h3v-1.8h-3v-1.3h1.4c2.8 0 4.7-2.2 4.2-5-2.6-.6-4.9.5-6.2 2.7Z" },
  { id: "schwertlilie", name: "Schwertlilie", split: true, d: "M11.3 21.5 3.4 6.2l1.5.5 7.8 13.6Z M12.7 21.5l7.9-15.3-1.5.5-7.8 13.6Z M12 1.5c-1.9 2.4-2.8 4.6-2.8 6.6 0 1.7.9 3.2 2.8 4.6 1.9-1.4 2.8-2.9 2.8-4.6 0-2-.9-4.2-2.8-6.6Z M10.6 12.6C9.8 9.2 6.6 7.6 3.4 8.6c-.3 1.7.5 3.3 2 4.2-1.2.2-2.1-.1-2.8-.7.2 2.4 2.4 3.6 4.8 3.3 1.4-.2 2.6-1.2 3.2-2.8Z M13.4 12.6c.8-3.4 4-5 7.2-4 .3 1.7-.5 3.3-2 4.2 1.2.2 2.1-.1 2.8-.7-.2 2.4-2.4 3.6-4.8 3.3-1.4-.2-2.6-1.2-3.2-2.8Z M7.6 13.2h8.8v2.1H7.6Z M10.7 15.3h2.6v1.5L12 21.6l-1.3-4.8Z" },
  { id: "mondsichel", name: "Mondsichel", d: "M14 3a9 9 0 1 0 0 18a7.4 7.4 0 0 1 0-18Z" },
  { id: "stern", name: "Stern", d: "M12 2.2l2.6 6 6.5.6-4.9 4.3 1.5 6.4L12 16.1l-5.7 3.4 1.5-6.4-4.9-4.3 6.5-.6Z" },
  { id: "sonne", name: "Sonne", d: sun() },
  { id: "krone", name: "Krone", d: "M3.2 7.6l4.7 3.8L12 3.8l4.1 7.6 4.7-3.8-1.7 10H4.9Z M4.9 19h14.2v2.2H4.9Z" },
  { id: "kreuz", name: "Tatzenkreuz", d: "M9.6 2.5h4.8l-1 6.9 7.1-1v4.8l-7.1-1 1 6.9H9.6l1-6.9-7.1 1V8.4l7.1 1Z" },
  { id: "herz", name: "Herz", d: "M12 21s-8.8-5.3-8.8-11.3A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8.8 2.5C20.8 15.7 12 21 12 21Z" },
  { id: "rose", name: "Rose", d: rose() },
  { id: "turm", name: "Turm", d: "M6 21.5V10h12v11.5h-4.2v-3.8a1.8 1.8 0 0 0-3.6 0v3.8Z M5 9V3.5h3v2.2h2.4V3.5h3.2v2.2H16V3.5h3V9Z" },
  { id: "schluessel", name: "Schlüssel", d: "M12 1.8a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6Zm0 2.1a1.7 1.7 0 1 0 0 3.4a1.7 1.7 0 1 0 0-3.4Z M10.9 9.2h2.2v12.6h-2.2Z M13.1 16.4h3.6v2.1h-3.6Z M13.1 19.6h2.6v2.2h-2.6Z" },
  { id: "schwert", name: "Schwert", d: "M10.9 15V3.6L12 1.5l1.1 2.1V15Z M6.8 15h10.4v1.8H6.8Z M11.1 16.8h1.8v3.4h-1.8Z M12 19.8a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2Z" },
  { id: "axt", name: "Axt", d: "M10.4 3h1.8v18.5h-1.8Z M12.2 4.5c4 0 6.9 1.8 8 5.1-1.1 3.3-4 5.1-8 5.1Z" },
  { id: "hammer", name: "Hammer", d: "M4.5 3.5h13.5v4.8H4.5Z M10.2 8.3h2.2v13.2h-2.2Z" },
  { id: "rad", name: "Rad", d: wheel() },
  { id: "aehre", name: "Ähre", d: wheat() },
  { id: "baum", name: "Baum", d: "M12 1.8c4.2 0 7.4 3.1 7.4 6.9 0 3.4-2.7 6-6.2 6.3v6.8h-2.4V15c-3.5-.3-6.2-2.9-6.2-6.3 0-3.8 3.2-6.9 7.4-6.9Z" },
  { id: "adler", name: "Adler", d: "M12 2.5c1.4 0 2.3 1 2.3 2.2 0 .6-.2 1.1-.5 1.5l1.4.8 6.3-2.4-1.3 3.1 1.3.5-2.1 2.5.8.5-3.4 2.4-2.5.2.9 2.3 2.4 1.6-3-.2-.9 2.6-1-1.7L12 21.5l-.7-2.7-1 1.7-.9-2.6-3 .2 2.4-1.6.9-2.3-2.5-.2-3.4-2.4.8-.5-2.1-2.5 1.3-.5-1.3-3.1 6.3 2.4 1.4-.8c-.3-.4-.5-.9-.5-1.5 0-1.2.9-2.2 2.3-2.2Z" },
  { id: "fisch", name: "Fisch", d: "M2.5 12c3.2-4.2 8.4-5.7 12.6-3.6l3.9-3.2v13.6l-3.9-3.2C10.9 17.7 5.7 16.2 2.5 12Zm5-1.4a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0-2.2Z" },
  { id: "pfeil", name: "Pfeil", d: "M12 1.5l3.6 5h-2.4v11.2l2.4 3.3v1.5H8.4V21l2.4-3.3V6.5H8.4Z" },
];

export const DEFAULT_ARMS: Arms = { shape: "giebel", division: "haupt", c1: "silber", c2: "burgund", charge: "mondsichel", cc: "schwarz", bc: "silber" };

export function CoatOfArms({ arms, className, style }: { arms: Arms; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const sh = getShield(arms.shape);
  const div = DIVISIONS.find((d) => d.id === arms.division) ?? DIVISIONS[0];
  const ch = CHARGES.find((c) => c.id === arms.charge);
  return (
    <svg viewBox="0 0 100 120" className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={id + "c"}><path d={sh.d} /></clipPath>
        <linearGradient id={id + "g"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" /><stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset=".75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect x="0" y="0" width="100" height="120" fill={tincture(arms.c1)} />
        {div.draw(tincture(arms.c2), sh.d)}
        {ch?.d && (
          <g fill={tincture(arms.cc)} transform="translate(23 30) scale(2.25)">
            {ch.split ? ch.d.split(/(?=M)/).map((d, i) => <path key={i} d={d} />) : <path d={ch.d} fillRule="evenodd" />}
          </g>
        )}
        <rect x="0" y="0" width="100" height="120" fill={`url(#${id}g)`} />
      </g>
      <path d={sh.d} fill="none" stroke={tincture(arms.bc ?? "silber")} strokeWidth="3" />
    </svg>
  );
}
