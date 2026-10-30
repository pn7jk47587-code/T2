import { unzipSync, strFromU8 } from "fflate";
import type { CycleDay, CycleLog } from "./types";

/**
 * Import aus Flo. Flo liefert auf Anfrage eine JSON- oder TXT-Datei (oft als ZIP).
 * Das genaue Format ist nicht öffentlich dokumentiert, deshalb sucht der Import nach Mustern:
 * Zeiträume mit Beginn und Ende (Perioden) und einzelne Tage mit Begriffen für Blutung,
 * Schmierblutung und Schmerzen, auf Englisch und Deutsch.
 */

export interface ImportResult {
  log: CycleLog;
  files: string[];
  keys: string[];
  from?: string;
  to?: string;
  counts: { flow: number; spotting: number; pain: number };
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, januar: 0, feb: 1, february: 1, februar: 1, mar: 2, march: 2, märz: 2, maerz: 2, apr: 3, april: 3, may: 4, mai: 4,
  jun: 5, june: 5, juni: 5, jul: 6, july: 6, juli: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, okt: 9, oktober: 9,
  nov: 10, november: 10, dec: 11, december: 11, dez: 11, dezember: 11,
};

/** Datum aus Zahl oder Text, Ergebnis YYYY-MM-DD oder null */
export function toDay(v: unknown): string | null {
  if (typeof v === "number" && isFinite(v)) {
    const ms = v > 1e12 ? v : v > 1e9 ? v * 1000 : NaN;
    if (!isNaN(ms)) { const d = new Date(ms); if (d.getFullYear() > 2005 && d.getFullYear() < 2040) return isoLocal(d); }
    return null;
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?/);
  if (m) {
    if (m[4] && m[6]) { const d = new Date(s); if (!isNaN(d.getTime())) return isoLocal(d); }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${pad(+m[1])}-${pad(+m[2])}`;
  m = s.match(/^([A-Za-zäÄ]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()] !== undefined) return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()] + 1)}-${pad(+m[2])}`;
  m = s.match(/^(\d{1,2})\.?\s+([A-Za-zäÄ]+)\.?\s+(\d{4})/);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()] + 1)}-${pad(+m[1])}`;
  return null;
}

const FLOW: [RegExp, 1 | 2 | 3 | 4][] = [
  [/very[\s_-]?heavy|super[\s_-]?heavy|extra[\s_-]?heavy|sehr[\s_-]?stark/i, 4],
  [/heavy|strong|stark/i, 3],
  [/medium|moderate|normal|mittel/i, 2],
  [/light|low|leicht|schwach/i, 1],
];
const SPOT = /spotting|schmier/i;
const PERIOD = /period|menstru|bleed|blutung|flow|periode/i;
const PAIN = /cramp|pain|ache|krampf|schmerz/i;

function flowLevel(t: string): 1 | 2 | 3 | 4 | undefined {
  for (const [re, v] of FLOW) if (re.test(t)) return v;
  return undefined;
}
function painLevel(t: string): 1 | 2 | 3 | 4 {
  if (/unbearable|extreme|very[\s_-]?severe|sehr[\s_-]?stark/i.test(t)) return 4;
  if (/severe|strong|stark|heavy/i.test(t)) return 3;
  if (/mild|light|leicht/i.test(t)) return 1;
  return 2;
}

function addDay(log: CycleLog, day: string, patch: CycleDay) {
  const cur = log[day] ?? {};
  const next: CycleDay = { ...cur };
  if (patch.flow) next.flow = Math.max(cur.flow ?? 0, patch.flow) as CycleDay["flow"];
  if (patch.spotting && !next.flow) next.spotting = patch.spotting;
  if (patch.pain) next.pain = Math.max(cur.pain ?? 0, patch.pain) as CycleDay["pain"];
  if (next.flow) delete next.spotting;
  log[day] = next;
}

function eachDay(a: string, b: string, f: (d: string) => void) {
  const d = new Date(a + "T12:00:00"), e = new Date(b + "T12:00:00");
  if (e < d || (e.getTime() - d.getTime()) / 864e5 > 15) { f(a); return; }
  for (; d <= e; d.setDate(d.getDate() + 1)) f(isoLocal(d));
}

/** Text eines Eintrags nach Blutung, Schmierblutung und Schmerzen auswerten */
function interpret(text: string, context: string): CycleDay {
  const t = text + " " + context;
  const out: CycleDay = {};
  if (SPOT.test(text)) out.spotting = /brown|braun/i.test(t) ? "braun" : "rot";
  else if (PERIOD.test(t)) { const lv = flowLevel(text); if (lv || /period|menstru|bleed|blutung/i.test(t)) out.flow = lv ?? 2; }
  if (PAIN.test(text)) out.pain = painLevel(text);
  return out;
}

function walkJson(node: unknown, path: string[], log: CycleLog, keys: Set<string>) {
  if (Array.isArray(node)) {
    // Liste reiner Datumswerte unter einem Perioden-Schlüssel
    if (node.length && node.every((x) => toDay(x)) && PERIOD.test(path.join("."))) {
      node.forEach((x) => addDay(log, toDay(x)!, { flow: 2 }));
      return;
    }
    node.forEach((x) => walkJson(x, path, log, keys));
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const ctx = path.join(".");
  keys.add([...path, ...Object.keys(obj)].slice(-3).join("."));
  const entries = Object.entries(obj);
  const dates = entries.filter(([k, v]) => /date|day|start|end|time|from|to|begin|finish|stop/i.test(k) && toDay(v)).map(([k, v]) => [k, toDay(v)!] as const);
  const start = dates.find(([k]) => /start|begin|from/i.test(k));
  const end = dates.find(([k]) => /end|finish|stop|^to$/i.test(k));
  const flat = entries.filter(([, v]) => typeof v !== "object" || v === null).map(([k, v]) => `${k}=${v}`).join(" ");
  if (start && end && PERIOD.test(ctx + " " + flat)) {
    const lv = flowLevel(flat);
    eachDay(start[1], end[1], (d) => addDay(log, d, { flow: lv ?? 2 }));
  } else if (dates.length) {
    const p = interpret(flat, ctx);
    if (p.flow || p.spotting || p.pain) addDay(log, dates[0][1], p);
  }
  for (const [k, v] of entries) if (v && typeof v === "object") walkJson(v, [...path, k], log, keys);
}

function walkText(text: string, log: CycleLog) {
  let section = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[;,\t|]|\s{2,}|\s[-–]\s/);
    const ds = parts.map((x) => toDay(x.trim())).filter(Boolean) as string[];
    if (!ds.length) { section = line; continue; }
    if (ds.length >= 2 && PERIOD.test(section + " " + line)) {
      eachDay(ds[0], ds[1], (d) => addDay(log, d, { flow: flowLevel(line) ?? 2 }));
      continue;
    }
    const p = interpret(line, section);
    if (p.flow || p.spotting || p.pain) addDay(log, ds[0], p);
  }
}

export async function parseFloFiles(list: FileList | File[]): Promise<ImportResult> {
  const log: CycleLog = {};
  const keys = new Set<string>();
  const names: string[] = [];
  const handle = (name: string, text: string) => {
    names.push(name);
    const t = text.replace(/^﻿/, "");
    if (/\.json$/i.test(name) || /^\s*[[{]/.test(t)) {
      try { walkJson(JSON.parse(t), [], log, keys); return; } catch { /* kein gültiges JSON, als Text lesen */ }
    }
    walkText(t, log);
  };
  for (const f of Array.from(list)) {
    if (/\.zip$/i.test(f.name)) {
      const files = unzipSync(new Uint8Array(await f.arrayBuffer()));
      for (const [n, data] of Object.entries(files)) if (/\.(json|txt|csv)$/i.test(n)) handle(n, strFromU8(data));
    } else handle(f.name, await f.text());
  }
  const days = Object.keys(log).sort();
  return {
    log, files: names, keys: Array.from(keys).slice(0, 60), from: days[0], to: days[days.length - 1],
    counts: { flow: days.filter((d) => log[d].flow).length, spotting: days.filter((d) => log[d].spotting).length, pain: days.filter((d) => log[d].pain).length },
  };
}
