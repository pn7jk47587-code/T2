import type { DayCard } from "./types";

/**
 * Datenquellen: alles, was dein Handy ohnehin über dich weiß.
 * Eine reine Web-App darf auf iOS weder Health, noch Standort im Hintergrund, noch Bildschirmzeit
 * pro App lesen. Deshalb gibt es hier eine feste Schnittstelle. Heute liefern die Anbieter nichts.
 * Später ersetzt eine native iOS-Hülle (Capacitor mit Swift-Plugins) die Platzhalter,
 * ohne dass sich Tageskarte oder Oberfläche ändern.
 */
export type SourceStatus = "geplant" | "braucht-native-huelle" | "bereit";

export interface DataSource {
  id: string;
  label: string;
  provides: string;
  status: SourceStatus;
  /** Wie die Anbindung später gedacht ist */
  route: string;
  collect: (isoDate: string) => Promise<Partial<DayCard>>;
}

const none = async () => ({});

export const sources: DataSource[] = [
  {
    id: "health",
    label: "Apple Health",
    provides: "Schritte, Schlaf, Aufstehzeit, Ernährung",
    status: "braucht-native-huelle",
    route: "HealthKit über ein natives Plugin. Läuft nur in einer installierten iOS-App, nicht im Browser.",
    collect: none,
  },
  {
    id: "location",
    label: "Standort & Wege",
    provides: "Wegstrecke, Route des Tages",
    status: "braucht-native-huelle",
    route: "Core Location mit Hintergrundstandort. Daten bleiben auf dem Gerät.",
    collect: none,
  },
  {
    id: "transit",
    label: "Bahnfahrten",
    provides: "Zeit in Bus und Bahn",
    status: "geplant",
    route: "Aus Route und Geschwindigkeit geschätzt oder von dir markiert. iOS erkennt Bahnfahrten nicht von selbst.",
    collect: none,
  },
  {
    id: "screentime",
    label: "Bildschirmzeit",
    provides: "Gesamtzeit und Zeit pro App",
    status: "braucht-native-huelle",
    route: "Screen-Time-API (Family Controls). Braucht ein Apple-Entitlement, Anzeige läuft über eine eigene Report-Erweiterung.",
    collect: none,
  },
];

export async function buildDayCard(isoDate: string): Promise<DayCard> {
  const parts = await Promise.all(sources.map((s) => s.collect(isoDate)));
  return Object.assign({ date: isoDate }, ...parts) as DayCard;
}

export const statusLabel: Record<SourceStatus, string> = {
  geplant: "geplant",
  "braucht-native-huelle": "braucht native App",
  bereit: "aktiv",
};
