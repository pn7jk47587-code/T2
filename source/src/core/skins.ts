import { createContext, useContext } from "react";

/**
 * Stile der Schmiede. Farben und Flächen stehen in styles/skins.css.
 * shield: Kacheln haben die Form eines Wappens (Formen in core/shields.ts).
 */
export type ParticleMode = "embers" | "sparks" | "none";

export interface Skin {
  id: string;
  name: string;
  particles: ParticleMode;
  shield?: string;
}

export const skins: Skin[] = [
  { id: "glut", name: "Glut", particles: "embers" },
  { id: "glanz", name: "Glanz", particles: "sparks" },
  { id: "burgund", name: "Burgund", particles: "embers" },
  { id: "schlicht", name: "Schlicht", particles: "none" },
  { id: "wappen", name: "Wappen", particles: "none", shield: "dreieck" },
];

export const getSkin = (id: string) => skins.find((s) => s.id === id) ?? skins[1];

export const SkinCtx = createContext<Skin>(skins[1]);
export const useSkin = () => useContext(SkinCtx);

export const NavCtx = createContext<(id: string) => void>(() => {});
export const useNav = () => useContext(NavCtx);
