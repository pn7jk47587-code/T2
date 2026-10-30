import { useId, type ReactElement } from "react";
import { getShield } from "./shields";
import { ICONS } from "./icons";
import type { Arms } from "./types";

/** Tinkturen */
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
const hex = (id: string) => TINCTURES.find((t) => t.id === id)?.hex ?? id;

/** Heroldsbilder (Teilungen) im Raster 100 x 120, in der zweiten Farbe gezeichnet */
export const DIVISIONS: { id: string; name: string; draw: (c: string) => ReactElement | null }[] = [
  { id: "einfarbig", name: "Einfarbig", draw: () => null },
  { id: "geteilt", name: "Geteilt", draw: (c) => <rect x="0" y="60" width="100" height="60" fill={c} /> },
  { id: "gespalten", name: "Gespalten", draw: (c) => <rect x="50" y="0" width="50" height="120" fill={c} /> },
  { id: "geviert", name: "Geviert", draw: (c) => <path d="M50 0H100V60H50ZM0 60H50V120H0Z" fill={c} /> },
  { id: "schraeg", name: "Schräggeteilt", draw: (c) => <path d="M0 0L100 120H0Z" fill={c} /> },
  { id: "haupt", name: "Schildhaupt", draw: (c) => <rect x="0" y="0" width="100" height="38" fill={c} /> },
  { id: "pfahl", name: "Pfahl", draw: (c) => <rect x="36" y="0" width="28" height="120" fill={c} /> },
  { id: "balken", name: "Balken", draw: (c) => <rect x="0" y="46" width="100" height="28" fill={c} /> },
  { id: "schraegbalken", name: "Schrägbalken", draw: (c) => <rect x="-30" y="48" width="170" height="24" fill={c} transform="rotate(50 50 60)" /> },
  { id: "sparren", name: "Sparren", draw: (c) => <path d="M50 34L104 88V112L50 58L-4 112V88Z" fill={c} /> },
  { id: "kreuz", name: "Kreuz", draw: (c) => <path d="M38 0H62V48H100V72H62V120H38V72H0V48H38Z" fill={c} /> },
  { id: "geschacht", name: "Geschacht", draw: (c) => (
    <g fill={c}>{Array.from({ length: 30 }, (_, i) => { const x = i % 5, y = Math.floor(i / 5); return (x + y) % 2 ? <rect key={i} x={x * 20} y={y * 20} width="20" height="20" /> : null; })}</g>
  ) },
];

/** Wappenbilder: die Modulsymbole und klassische gemeine Figuren */
export const CHARGES: Record<string, string[]> = {
  keins: [],
  ...ICONS,
  mondsichel: ["M14 3.5a8.5 8.5 0 1 0 0 17a7 7 0 0 1 0-17Z", "M18.5 9.5v5M16 12h5"],
  lilie: ["M12 3.5c-2 2.3-2 4.7 0 7.3c2-2.6 2-5 0-7.3Z", "M12 10.8v9.7", "M11.4 13.6C9 14.2 5.6 12.7 5.4 9.6c2.5-.4 4.6 1 5.2 3", "M12.6 13.6c2.4.6 5.8-.9 6-4c-2.5-.4-4.6 1-5.2 3", "M7.5 14.6h9", "M9.6 20.5c.2-1.8 1-2.8 2.4-2.8s2.2 1 2.4 2.8"],
  stern: ["M12 3l2.3 5.3 5.7.5-4.3 3.8 1.3 5.6L12 15.3l-5 2.9 1.3-5.6L4 8.8l5.7-.5Z"],
  krone: ["M4.5 17.5h15", "M5.3 17.5 4 8l4.6 3.6L12 5l3.4 6.6L20 8l-1.3 9.5", "M5 20.5h14"],
  rose: ["M12 7a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z", "M12 10a2 2 0 1 1 0 4a2 2 0 1 1 0-4Z", "M12 3.5V7M12 17v3.5M3.5 12H7M17 12h3.5"],
  schwert: ["M12 2.5 13.6 5v10.5h-3.2V5Z", "M7.5 15.5h9", "M12 15.5v4.2", "M12 21.4a1 1 0 1 0 0-.1"],
  tatzenkreuz: ["M10 3h4l-.8 5.8L19 8v4l-5.8-.8L14 21h-4l.8-9.8L5 12V8l5.8.8Z"],
};
export const CHARGE_NAMES: Record<string, string> = {
  keins: "Ohne", zyklus: "Kreislauf", mondsichel: "Mondsichel", erinnerungen: "Glocke", gefuehle: "Herz", gewohnheiten: "Amboss", finanzen: "Münze",
  fundorte: "Schlüssel", analytics: "Turm", archiv: "Buch", einstellungen: "Hammer", lilie: "Lilie", stern: "Stern",
  krone: "Krone", rose: "Rose", schwert: "Schwert", tatzenkreuz: "Tatzenkreuz",
};

export const DEFAULT_ARMS: Arms = { shape: "giebel", division: "haupt", c1: "silber", c2: "burgund", charge: "mondsichel", cc: "schwarz" };

export function CoatOfArms({ arms, className, style }: { arms: Arms; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const sh = getShield(arms.shape);
  const div = DIVISIONS.find((d) => d.id === arms.division) ?? DIVISIONS[0];
  const paths = CHARGES[arms.charge] ?? [];
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
        <rect x="0" y="0" width="100" height="120" fill={hex(arms.c1)} />
        {div.draw(hex(arms.c2))}
        <g transform="translate(26 34) scale(2)" fill="none" stroke={hex(arms.cc)} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {paths.map((d, i) => <path key={i} d={d} />)}
        </g>
        <rect x="0" y="0" width="100" height="120" fill={`url(#${id}g)`} />
      </g>
      <path d={sh.d} fill="none" stroke="#f2f4f6" strokeOpacity=".85" strokeWidth="2.2" />
    </svg>
  );
}
