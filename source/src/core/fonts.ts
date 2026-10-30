/** Frakturschriften für Überschriften. Alle liegen lokal in der App, ohne Google Fonts. */
export interface FontDef { id: string; name: string; family: string; weight: number }

export const FONTS: FontDef[] = [
  { id: "pirata", name: "Pirata One", family: "'Pirata One'", weight: 400 },
  { id: "maguntia", name: "Unifraktur Maguntia", family: "'UnifrakturMaguntia'", weight: 400 },
  { id: "cook", name: "Unifraktur Cook", family: "'UnifrakturCook'", weight: 700 },
  { id: "grenze", name: "Grenze Gotisch", family: "'Grenze Gotisch'", weight: 500 },
  { id: "fruktur", name: "Fruktur", family: "'Fruktur'", weight: 400 },
  { id: "texturina", name: "Texturina", family: "'Texturina'", weight: 500 },
  { id: "rocker", name: "New Rocker", family: "'New Rocker'", weight: 400 },
  { id: "bastarda", name: "Jacquarda Bastarda", family: "'Jacquarda Bastarda 9'", weight: 400 },
];

export const getFont = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export function applyFont(id: string) {
  const f = getFont(id);
  const r = document.documentElement.style;
  r.setProperty("--font-display", `${f.family}, Georgia, serif`);
  r.setProperty("--head-weight", String(f.weight));
}
