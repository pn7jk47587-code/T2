import { Shell } from "../components/Shell";
import type { ModuleDef } from "../core/modules";

/** Platzhalter für Module, die noch ausgearbeitet werden. */
export function Stub({ mod, back }: { mod: ModuleDef; back: () => void }) {
  return <Shell mod={mod} back={back} />;
}
