/** Profil auf der Startseite */
export interface Profile {
  name: string;
  /** Mehrere Sprüche, die Startseite wechselt per Tipp durch */
  mottos: string[];
  /** Verkleinertes Profilbild als Data-URL */
  photo?: string;
}

/**
 * Eine Tageskarte fürs Archiv. Sie wird am Tagesende aus den Daten aller Module gebaut
 * und danach nicht mehr verändert. Jedes Feld ist optional, weil nicht jede Datenquelle
 * an jedem Tag Werte liefert.
 */
export interface DayCard {
  /** ISO-Datum, z. B. 2026-10-30 */
  date: string;
  steps?: number;
  /** Zeiten als HH:MM */
  wakeUp?: string;
  bedtime?: string;
  screenTimeMinutes?: number;
  screenTimeByApp?: { app: string; minutes: number }[];
  spentCents?: number;
  /** Stimmung 1 (schwer) bis 5 (leicht), Mittel aus den Einträgen des Tages */
  mood?: number;
  moodTags?: string[];
  meals?: string[];
  transitMinutes?: number;
  /** Grobe Wegstrecke, später als Linie auf einer Karte */
  routeKm?: number;
  habitsDone?: number;
  habitsTotal?: number;
  /** Markiert Beispieldaten, damit sie nie mit echten Tagen verwechselt werden */
  demo?: boolean;
}

/** Ein Eintrag im Modul "Fundorte" */
export interface StoredItem {
  id: string;
  name: string;
  place: string;
  note?: string;
  createdAt: number;
}

export type Route =
  | { name: "home" }
  | { name: "module"; id: string };

/** Eine Erinnerung */
export interface Reminder {
  id: string;
  title: string;
  category: string;
  /** YYYY-MM-DD */
  date?: string;
  /** HH:MM */
  time?: string;
  done: boolean;
  createdAt: number;
  doneAt?: number;
  notes?: string;
  url?: string;
  urgent?: boolean;
  /** Unterpunkte, entstehen aus Kommas im Titel */
  subs?: { id: string; title: string; done: boolean }[];
  /** Eingabe wie getippt (für die Bearbeitung) */
  raw?: string;
  /** Fristablauf, YYYY-MM-DD */
  frist?: string;
  /** Vorfrist, YYYY-MM-DD */
  vorfrist?: string;
}

/** Ein Tag im Zyklus. flow 1–4: leicht, mittel, stark, sehr stark. pain 1–4. */
export interface CycleDay {
  flow?: 1 | 2 | 3 | 4;
  spotting?: "rot" | "braun";
  pain?: 1 | 2 | 3 | 4;
}
export type CycleLog = Record<string, CycleDay>;

/** Eigenes Wappen */
export interface Arms {
  shape: string;
  division: string;
  c1: string;
  c3?: string;
  c2: string;
  charge: string;
  cc: string;
  /** Farbe des Schildrands */
  bc?: string;
}
