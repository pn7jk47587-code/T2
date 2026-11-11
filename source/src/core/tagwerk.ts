/** Tagwerk: Tagesplan mit Zeitblöcken, Liste „Offen“ und Ehrenpunkten. Alles bleibt lokal. */
import { iso } from "./overview";

export type Repeat = "nie" | "taeglich" | "werktags" | "woechentlich" | "monatlich";
export interface Cat { id: string; name: string; color: string; points: number; remind: number | null }
export interface Tpl { id: string; title: string; cat: string; start: string; dur: number; repeat: Exclude<Repeat, "nie">; from: string; points?: number; remind?: number | null }
export interface Task {
  id: string; title: string; cat: string;
  date?: string; start?: string; dur: number;
  points: number; remind: number | null;
  done: boolean; doneAt?: number;
  tpl?: string; tplDate?: string;
  /** ursprünglich geplantes Datum, wenn es nach „Offen“ gewandert ist */
  was?: string; createdAt: number;
}
export interface Tagwerk { cats: Cat[]; tpls: Tpl[]; tasks: Task[]; skip: string[]; sweep?: string; seen: string[] }

export const PALETTE = ["#b3243b", "#c8a24a", "#6f90e0", "#62c48c", "#9b6fd0", "#d9814a", "#5fb7c4", "#c3c8cd"];

export const DEFAULT: Tagwerk = {
  cats: [
    { id: "lernen", name: "Lernen", color: "#6f90e0", points: 3, remind: 5 },
    { id: "self", name: "Self-Explanation", color: "#c8a24a", points: 2, remind: 0 },
    { id: "fahrt", name: "Fahrt", color: "#5fb7c4", points: 1, remind: 10 },
    { id: "alltag", name: "Alltag", color: "#62c48c", points: 1, remind: 10 },
  ],
  tpls: [{ id: "self-1830", title: "Self-Explanation Time", cat: "self", start: "18:30", dur: 20, repeat: "taeglich", from: "2026-01-01" }],
  tasks: [], skip: [], seen: [],
};

export const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const toHHMM = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const addDays = (d: string, n: number) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return iso(x); };

export function tplOn(t: Tpl, d: string) {
  if (d < t.from) return false;
  const x = new Date(d + "T12:00:00"), f = new Date(t.from + "T12:00:00");
  switch (t.repeat) {
    case "taeglich": return true;
    case "werktags": return x.getDay() >= 1 && x.getDay() <= 5;
    case "woechentlich": return x.getDay() === f.getDay();
    case "monatlich": return x.getDate() === f.getDate();
  }
}

/** Fehlende Termine aus Vorlagen für die angegebenen Tage anlegen */
export function materialize(w: Tagwerk, days: string[]): Tagwerk {
  const add: Task[] = [];
  for (const d of days) for (const t of w.tpls) {
    if (!tplOn(t, d)) continue;
    const key = t.id + "@" + d;
    if (w.skip.includes(key) || w.tasks.some((x) => x.tpl === t.id && x.tplDate === d)) continue;
    const c = w.cats.find((x) => x.id === t.cat);
    add.push({ id: crypto.randomUUID(), title: t.title, cat: t.cat, date: d, start: t.start, dur: t.dur, points: t.points ?? c?.points ?? 1, remind: t.remind !== undefined ? t.remind : c?.remind ?? null, done: false, tpl: t.id, tplDate: d, createdAt: Date.now() });
  }
  return add.length ? { ...w, tasks: [...w.tasks, ...add] } : w;
}

/** Was an vergangenen Tagen offen blieb, wandert nach „Offen“. Nichts geht verloren, nichts wird bestraft. */
export function sweep(w: Tagwerk, today: string): Tagwerk {
  if (w.sweep === today) return w;
  return { ...w, sweep: today, tasks: w.tasks.map((t) => (t.date && t.date < today && !t.done ? { ...t, was: t.date, date: undefined, start: undefined } : t)) };
}

/** Erste freie Lücke an einem Tag (Raster 15 Min.) für eine Dauer */
export function freeSlot(w: Tagwerk, d: string, dur: number, fromMin = 8 * 60, toMin_ = 22 * 60): string | null {
  const busy = w.tasks.filter((t) => t.date === d && t.start).map((t) => [toMin(t.start!), toMin(t.start!) + t.dur] as const);
  for (let s = Math.ceil(fromMin / 15) * 15; s + dur <= toMin_; s += 15) if (!busy.some(([a, b]) => s < b && s + dur > a)) return toHHMM(s);
  return null;
}

export const catOf = (w: Tagwerk, id: string) => w.cats.find((c) => c.id === id) ?? w.cats[0] ?? { id: "", name: "", color: "#c3c8cd", points: 1, remind: null };

/** Kalenderdatei mit Erinnerungen für die übergebenen Termine */
export function icsFor(w: Tagwerk, tasks: Task[]) {
  const esc = (s: string) => s.replace(/[\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const dt = (d: string, hm: string) => d.replace(/-/g, "") + "T" + hm.replace(":", "") + "00";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ev = tasks.filter((t) => t.date && t.start && !t.done).map((t) => [
    "BEGIN:VEVENT", `UID:${t.id}@tagwerk`, `DTSTAMP:${stamp}`,
    `DTSTART:${dt(t.date!, t.start!)}`, `DTEND:${dt(t.date!, toHHMM(toMin(t.start!) + t.dur))}`,
    `SUMMARY:${esc(t.title)}`, `CATEGORIES:${esc(catOf(w, t.cat).name)}`,
    ...(t.remind !== null ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(t.title)}`, `TRIGGER:-PT${t.remind}M`, "END:VALARM"] : []),
    "END:VEVENT",
  ].join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//App//Tagwerk//DE", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
}
