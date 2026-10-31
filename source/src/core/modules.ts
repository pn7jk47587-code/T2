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
}

export const modules: ModuleDef[] = [
  {
    id: "zyklus",
    title: "Mondlauf",
    icon: "zyklus",
    a: "var(--clay)",
    b: "var(--sand)",
    feeds: [{ id: "cycleDay", label: "Mondtag" }],
  },
  {
    id: "erinnerungen",
    title: "Erinnerungen",
    icon: "erinnerungen",
    a: "var(--sand)",
    b: "var(--clay)",
    feeds: [{ id: "dueToday", label: "Heute fällig" }],
  },
  {
    id: "gefuehle",
    title: "Gemüt",
    icon: "gefuehle",
    a: "var(--teal)",
    b: "var(--green)",
    feeds: [{ id: "mood", label: "Stimmung" }],
  },
  {
    id: "gewohnheiten",
    title: "Gelübde",
    icon: "gewohnheiten",
    a: "var(--green)",
    b: "var(--moss)",
    feeds: [{ id: "habits", label: "Gelübde" }],
  },
  {
    id: "finanzen",
    title: "Säckel",
    icon: "finanzen",
    a: "var(--moss)",
    b: "var(--teal)",
    feeds: [{ id: "spent", label: "Ausgaben" }],
  },
  {
    id: "fundorte",
    title: "Schatzkarte",
    icon: "fundorte",
    a: "var(--umber)",
    b: "var(--sand)",
    feeds: [],
  },
  {
    id: "analytics",
    title: "Seelenspiegel",
    icon: "analytics",
    a: "var(--teal)",
    b: "var(--sand)",
    feeds: [],
  },
  {
    id: "archiv",
    title: "Annalen",
    icon: "archiv",
    a: "var(--clay)",
    b: "var(--teal)",
    feeds: [],
  },
  {
    id: "befinden",
    title: "Siechenbuch",
    icon: "befinden",
    a: "var(--teal)",
    b: "var(--moss)",
    feeds: [],
  },
  {
    id: "flickwerk",
    title: "Flickwerk",
    icon: "flickwerk",
    a: "var(--umber)",
    b: "var(--clay)",
    feeds: [],
  },
  {
    id: "einstellungen",
    title: "Einstellungen",
    icon: "einstellungen",
    a: "var(--moon)",
    b: "var(--teal)",
    feeds: [],
  },
];

export const getModule = (id: string) => modules.find((m) => m.id === id);
