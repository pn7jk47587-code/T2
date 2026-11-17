import { lazy, type ComponentType } from "react";
import type { ModuleDef } from "../core/modules";
import { Stub } from "./Stub";

const Einstellungen = lazy(() => import("./Einstellungen").then((m) => ({ default: m.Einstellungen })));
const Erinnerungen = lazy(() => import("./Erinnerungen").then((m) => ({ default: m.Erinnerungen })));
const Zyklus = lazy(() => import("./Zyklus").then((m) => ({ default: m.Zyklus })));
const Gefuehle = lazy(() => import("./Gefuehle").then((m) => ({ default: m.Gefuehle })));
const Flickwerk = lazy(() => import("./Flickwerk").then((m) => ({ default: m.Flickwerk })));
const Befinden = lazy(() => import("./Befinden").then((m) => ({ default: m.Befinden })));
const Aufruesten = lazy(() => import("./Aufruesten").then((m) => ({ default: m.Aufruesten })));
const Heldenbuch = lazy(() => import("./Heldenbuch").then((m) => ({ default: m.Heldenbuch })));
const Tagwerk = lazy(() => import("./Tagwerk").then((m) => ({ default: m.Tagwerk })));
const Buchbinderei = lazy(() => import("./Buchbinderei").then((m) => ({ default: m.Buchbinderei })));
const Formelbuch = lazy(() => import("./Formelbuch").then((m) => ({ default: m.Formelbuch })));

type Screen = ComponentType<{ mod: ModuleDef; back: () => void }>;

/** Module ohne Eintrag hier zeigen eine leere Seite. */
export const screens: Record<string, Screen> = {
  einstellungen: Einstellungen,
  erinnerungen: Erinnerungen,
  zyklus: Zyklus,
  gefuehle: Gefuehle,
  flickwerk: Flickwerk,
  befinden: Befinden,
  aufruesten: Aufruesten,
  heldenbuch: Heldenbuch,
  tagwerk: Tagwerk,
  buchbinderei: Buchbinderei,
  formelbuch: Formelbuch,
};

export const screenFor = (id: string): Screen => screens[id] ?? Stub;
