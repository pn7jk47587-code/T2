import type { ModuleDef } from "../core/modules";
import { Stub } from "./Stub";
import { Einstellungen } from "./Einstellungen";

type Screen = (props: { mod: ModuleDef; back: () => void }) => JSX.Element;

/** Module ohne Eintrag hier zeigen eine leere Seite. */
export const screens: Record<string, Screen> = {
  einstellungen: Einstellungen,
};

export const screenFor = (id: string): Screen => screens[id] ?? Stub;
