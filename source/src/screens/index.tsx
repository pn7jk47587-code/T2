import type { ModuleDef } from "../core/modules";
import { Stub } from "./Stub";
import { Einstellungen } from "./Einstellungen";
import { Erinnerungen } from "./Erinnerungen";
import { Zyklus } from "./Zyklus";
import { Gefuehle } from "./Gefuehle";
import { Flickwerk } from "./Flickwerk";

type Screen = (props: { mod: ModuleDef; back: () => void }) => JSX.Element;

/** Module ohne Eintrag hier zeigen eine leere Seite. */
export const screens: Record<string, Screen> = {
  einstellungen: Einstellungen,
  erinnerungen: Erinnerungen,
  zyklus: Zyklus,
  gefuehle: Gefuehle,
  flickwerk: Flickwerk,
};

export const screenFor = (id: string): Screen => screens[id] ?? Stub;
