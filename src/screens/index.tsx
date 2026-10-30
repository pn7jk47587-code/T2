import type { ModuleDef } from "../core/modules";
import { Stub } from "./Stub";
import { Fundorte } from "./Fundorte";
import { Archiv } from "./Archiv";
import { Einstellungen } from "./Einstellungen";

type Screen = (props: { mod: ModuleDef; back: () => void }) => JSX.Element;

/** Module ohne Eintrag hier zeigen den Platzhalter. */
export const screens: Record<string, Screen> = {
  fundorte: Fundorte,
  archiv: Archiv,
  einstellungen: Einstellungen,
};

export const screenFor = (id: string): Screen => screens[id] ?? Stub;
