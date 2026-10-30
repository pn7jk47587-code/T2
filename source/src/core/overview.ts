import { useStored } from "./db";
import type { CycleLog, Reminder } from "./types";

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Zyklustag: Tage seit dem ersten Tag der letzten Periode (Tag 1 = erster Blutungstag). */
export function cycleDay(log: CycleLog, today = new Date()): number | null {
  const d = new Date(today); d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 90; i++) {
    const k = iso(d);
    if (log[k]?.flow) {
      const prev = new Date(d); prev.setDate(prev.getDate() - 1);
      if (!log[iso(prev)]?.flow) return i + 1;
    }
    d.setDate(d.getDate() - 1);
  }
  return null;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Werte für den Tagesüberblick, die schon aus Modulen kommen. */
export function useOverviewValues(): Record<string, string> {
  const [rem] = useStored<Reminder[]>("erinnerungen", []);
  const [cyc] = useStored<CycleLog>("zyklus", {});
  const cd = cycleDay(cyc);
  const t = todayISO();
  const due = rem.filter((r) => !r.done && r.date && r.date <= t).length;
  const out: Record<string, string> = { dueToday: String(due) };
  if (cd) out.cycleDay = String(cd);
  return out;
}
