import { useStored } from "./db";
import type { Reminder } from "./types";

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Werte für den Tagesüberblick, die schon aus Modulen kommen. */
export function useOverviewValues(): Record<string, string> {
  const [rem] = useStored<Reminder[]>("erinnerungen", []);
  const t = todayISO();
  const due = rem.filter((r) => !r.done && r.date && r.date <= t).length;
  return { dueToday: String(due) };
}
