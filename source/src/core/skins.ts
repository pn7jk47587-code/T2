import { createContext, useContext } from "react";

/**
 * Stile. Ein Stil besteht aus Farben und Schrift (styles/skins.css), einem Symbolsatz,
 * einer Partikelart im Hintergrund und optional dem Mond.
 */
export type IconSet = "magie" | "ritter" | "tech";
export type ParticleMode = "glitter" | "stars" | "fireflies" | "dust" | "embers" | "rain" | "none";

export interface Skin {
  id: string;
  name: string;
  group: string;
  icons: IconSet;
  particles: ParticleMode;
  moon: boolean;
}

export const skins: Skin[] = [
  { id: "mond-1", name: "Mondteich", group: "Mondlicht", icons: "magie", particles: "glitter", moon: true },
  { id: "mond-2", name: "Sternenhimmel", group: "Mondlicht", icons: "magie", particles: "stars", moon: true },
  { id: "wald-1", name: "Moosiger Wald", group: "Wald", icons: "magie", particles: "fireflies", moon: false },
  { id: "wald-2", name: "Nebelwald", group: "Wald", icons: "magie", particles: "dust", moon: false },
  { id: "ritter-1", name: "Burg und Wappen", group: "Mittelalter", icons: "ritter", particles: "embers", moon: false },
  { id: "ritter-2", name: "Schmiede", group: "Mittelalter", icons: "ritter", particles: "embers", moon: false },
  { id: "scifi-1", name: "Neon Cyberpunk", group: "Sci-Fi", icons: "tech", particles: "rain", moon: false },
  { id: "scifi-2", name: "Retro-Futurismus", group: "Sci-Fi", icons: "tech", particles: "stars", moon: false },
  { id: "metall-1", name: "Schwarzstahl", group: "Metall", icons: "tech", particles: "none", moon: false },
  { id: "metall-2", name: "Platin", group: "Metall", icons: "tech", particles: "none", moon: false },
];

export const getSkin = (id: string) => skins.find((s) => s.id === id) ?? skins[0];

export const SkinCtx = createContext<Skin>(skins[0]);
export const useSkin = () => useContext(SkinCtx);

/** Navigation: Seite per ID öffnen (Modul-ID oder "stile") */
export const NavCtx = createContext<(id: string) => void>(() => {});
export const useNav = () => useContext(NavCtx);
