/**
 * Versteckte Überraschungen (Easter Eggs).
 * Jede hat eine ID und löst sich über `findEgg(id)` aus. Neue Eggs kommen hier hinein
 * und werden an beliebiger Stelle der Oberfläche mit `triggerEgg("id")` ausgelöst.
 * Gefundene Eggs merkt sich die App lokal unter dem Schlüssel "eggs".
 */
import { kvGet, kvSet } from "./db";

export interface Egg {
  id: string;
  /** Wirkung beim Auslösen */
  run: () => void;
}

export const burst = (x?: number, y?: number) =>
  window.dispatchEvent(new CustomEvent("sparkle-burst", { detail: { x, y } }));

export const eggs: Egg[] = [
  { id: "mond", run: () => burst(window.innerWidth - 40, 50) },
];

export async function triggerEgg(id: string) {
  const egg = eggs.find((e) => e.id === id);
  if (!egg) return;
  egg.run();
  const found = (await kvGet<string[]>("eggs")) ?? [];
  if (!found.includes(id)) await kvSet("eggs", [...found, id]);
}
