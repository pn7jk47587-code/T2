/**
 * Modulregister. Jede Kachel auf der Startseite ist ein Eintrag hier.
 * Ein neues Modul braucht genau drei Schritte: Eintrag hier, Screen in src/screens/,
 * Screen in src/screens/index.tsx zuordnen.
 */
export interface Feed {
  id: string;
  label: string;
}

export interface ModuleDef {
  id: string;
  title: string;
  icon: string;
  /** Farbverlauf der Kachel */
  a: string;
  b: string;
  /** Werte, die dieses Modul zum Tagesüberblick und zur Tageskarte beisteuert */
  feeds: Feed[];
  /** Fragen, die ich für die Ausarbeitung von dir brauche */
  open: string[];
}

export const modules: ModuleDef[] = [
  {
    id: "zyklus",
    title: "Zyklus",
    icon: "moon",
    a: "var(--clay)",
    b: "var(--sand)",
    feeds: [{ id: "cycleDay", label: "Zyklustag" }],
    open: ["Welche Angaben willst du pro Tag erfassen?", "Soll die App Prognosen berechnen?"],
  },
  {
    id: "erinnerungen",
    title: "Erinnerungen",
    icon: "hourglass",
    a: "var(--sand)",
    b: "var(--clay)",
    feeds: [{ id: "dueToday", label: "Heute fällig" }],
    open: [
      "Was fehlt dir bei Apple Erinnerungen konkret?",
      "Echte Push-Benachrichtigungen setzen später die native iOS-Hülle voraus.",
    ],
  },
  {
    id: "gefuehle",
    title: "Gefühle",
    icon: "potion",
    a: "var(--teal)",
    b: "var(--green)",
    feeds: [{ id: "mood", label: "Stimmung" }],
    open: ["Welche Gefühlsachsen und Begriffe willst du nutzen?", "Mehrmals täglich oder einmal am Abend?"],
  },
  {
    id: "gewohnheiten",
    title: "Gewohnheiten",
    icon: "sprout",
    a: "var(--green)",
    b: "var(--moss)",
    feeds: [{ id: "habits", label: "Gewohnheiten" }],
    open: ["Tägliche, wöchentliche oder freie Rhythmen?", "Mit Serien (Streaks) oder ohne?"],
  },
  {
    id: "finanzen",
    title: "Finanzen",
    icon: "pouch",
    a: "var(--moss)",
    b: "var(--teal)",
    feeds: [{ id: "spent", label: "Ausgaben" }],
    open: ["Manuelle Eingabe oder Import von Kontoumsätzen (CSV)?", "Kategorien und Budgets?"],
  },
  {
    id: "fundorte",
    title: "Fundorte",
    icon: "key",
    a: "var(--umber)",
    b: "var(--sand)",
    feeds: [],
    open: ["Fotos zu Gegenständen und Orten?", "Orte als Hierarchie (Wohnung, Zimmer, Schrank)?"],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: "orb",
    a: "var(--teal)",
    b: "var(--sand)",
    feeds: [],
    open: ["Welche Zusammenhänge interessieren dich zuerst (Schlaf und Stimmung, Ausgaben und Tage)?"],
  },
  {
    id: "archiv",
    title: "Archiv",
    icon: "scroll",
    a: "var(--clay)",
    b: "var(--teal)",
    feeds: [],
    open: [],
  },
  {
    id: "einstellungen",
    title: "Einstellungen",
    icon: "wand",
    a: "var(--moon)",
    b: "var(--teal)",
    feeds: [],
    open: [],
  },
];

export const getModule = (id: string) => modules.find((m) => m.id === id);
