/**
 * Nachschlagewerk Mönch nach den D&D-Regeln von 2024 (5.5).
 * Eigene deutsche Zusammenfassung auf Grundlage des System Reference Document 5.2.1
 * von Wizards of the Coast LLC, lizenziert unter CC-BY-4.0
 * (https://creativecommons.org/licenses/by/4.0/). Die Begriffe sind eigene Übersetzungen
 * und können vom deutschen Spielerhandbuch abweichen.
 */
export const ATTRIBUTION = "Enthält Inhalte aus dem System Reference Document 5.2.1 von Wizards of the Coast LLC, lizenziert unter CC-BY-4.0. Eigene deutsche Zusammenfassung, Begriffe können vom deutschen Spielerhandbuch abweichen.";

/** Stufe → [Übungsbonus, Kampfkunstwürfel, Fokuspunkte, Bewegungsbonus in Metern] */
export const TABLE: Record<number, [number, string, number, number]> = {
  1: [2, "W6", 0, 0], 2: [2, "W6", 2, 3], 3: [2, "W6", 3, 3], 4: [2, "W6", 4, 3], 5: [3, "W8", 5, 3],
  6: [3, "W8", 6, 4.5], 7: [3, "W8", 7, 4.5], 8: [3, "W8", 8, 4.5], 9: [4, "W8", 9, 4.5], 10: [4, "W8", 10, 6],
  11: [4, "W10", 11, 6], 12: [4, "W10", 12, 6], 13: [5, "W10", 13, 6], 14: [5, "W10", 14, 7.5], 15: [5, "W10", 15, 7.5],
  16: [5, "W10", 16, 7.5], 17: [6, "W12", 17, 7.5], 18: [6, "W12", 18, 9], 19: [6, "W12", 19, 9], 20: [6, "W12", 20, 9],
};

export interface Feature { level: number; name: string; text: string }

export const FEATURES: Feature[] = [
  { level: 1, name: "Kampfkunst", text: "Ohne Rüstung und Schild, nur mit waffenlosem Schlag oder Mönchswaffen: Als Bonusaktion ein zusätzlicher waffenloser Schlag. Schaden mit dem Kampfkunstwürfel statt des normalen Schadens. Geschicklichkeit statt Stärke für Angriff, Schaden und die SG von Greifen und Stoßen." },
  { level: 1, name: "Ungerüstete Verteidigung", text: "Ohne Rüstung und Schild beträgt die Grund-RK 10 + Geschicklichkeits- + Weisheitsmodifikator." },
  { level: 2, name: "Fokus des Mönchs", text: "Fokuspunkte laut Tabelle, alle zurück nach kurzer oder langer Rast. Rettungswurf-SG der Fokusfähigkeiten: 8 + Weisheitsmodifikator + Übungsbonus. Dazu gehören Schlaghagel, Geduldige Verteidigung und Schritt des Windes (siehe unten)." },
  { level: 2, name: "Ungerüstete Bewegung", text: "Ohne Rüstung und Schild steigt die Bewegungsrate um den Wert der Tabelle." },
  { level: 2, name: "Unheimlicher Stoffwechsel", text: "Einmal pro langer Rast beim Initiativewurf: alle Fokuspunkte zurück und Trefferpunkte in Höhe von Mönchsstufe + ein Wurf des Kampfkunstwürfels." },
  { level: 3, name: "Angriffe ablenken", text: "Reaktion, wenn ein Angriff mit Wucht-, Stich- oder Hiebschaden trifft: Schaden sinkt um 1W10 + Geschicklichkeitsmodifikator + Mönchsstufe. Sinkt er auf 0, kann man für 1 Fokuspunkt die Wucht auf eine Kreatur in der Nähe umlenken." },
  { level: 3, name: "Unterklasse", text: "Wahl der Mönchstradition. Im Regelwerk für alle frei: Krieger der offenen Hand. Im Spielerhandbuch zusätzlich Krieger der Barmherzigkeit, Krieger der Schatten und Krieger der Elemente." },
  { level: 4, name: "Attributswerterhöhung", text: "Ein Talent oder eine Erhöhung der Attributswerte. Wiederholt auf Stufe 8, 12 und 16." },
  { level: 4, name: "Langsamer Fall", text: "Reaktion beim Fallen: Fallschaden sinkt um das Fünffache der Mönchsstufe." },
  { level: 5, name: "Zusätzlicher Angriff", text: "Zwei Angriffe statt einem bei der Aktion Angriff." },
  { level: 5, name: "Betäubender Schlag", text: "Einmal pro Zug nach einem Treffer mit Mönchswaffe oder waffenlosem Schlag, für 1 Fokuspunkt: Konstitutionsrettungswurf. Misslingt er, ist das Ziel bis zum Beginn deines nächsten Zuges betäubt. Gelingt er, halbiert sich seine Bewegungsrate und der nächste Angriff gegen es hat Vorteil." },
  { level: 6, name: "Verstärkte Schläge", text: "Waffenlose Schläge können wahlweise Energieschaden verursachen." },
  { level: 7, name: "Entrinnen", text: "Bei Geschicklichkeitsrettungswürfen für halben Schaden: gelungen kein Schaden, misslungen halber Schaden. Nicht, solange man kampfunfähig ist." },
  { level: 9, name: "Akrobatische Bewegung", text: "Ohne Rüstung und Schild an senkrechten Flächen und über Flüssigkeiten laufen, ohne zu fallen, solange der Zug andauert." },
  { level: 10, name: "Gesteigerter Fokus", text: "Schlaghagel gibt drei statt zwei Schläge. Geduldige Verteidigung gibt zusätzlich temporäre Trefferpunkte (zwei Würfe des Kampfkunstwürfels). Schritt des Windes kann eine willige große oder kleinere Kreatur mitnehmen." },
  { level: 10, name: "Selbstheilung", text: "Am Ende jedes eigenen Zuges endet ein Zustand Bezaubert, Verängstigt oder Vergiftet. Kein Erschöpfungsgrad durch Verzicht auf Essen und Trinken." },
  { level: 13, name: "Energie ablenken", text: "Angriffe ablenken wirkt gegen jede Schadensart." },
  { level: 14, name: "Disziplinierter Überlebender", text: "Übung in allen Rettungswürfen. Misslingt einer, darf man ihn für 1 Fokuspunkt wiederholen und muss das neue Ergebnis nehmen." },
  { level: 15, name: "Perfekter Fokus", text: "Beim Initiativewurf ohne Unheimlichen Stoffwechsel: Wer 3 oder weniger Fokuspunkte hat, füllt auf 4 auf." },
  { level: 18, name: "Überlegene Verteidigung", text: "Zu Beginn des eigenen Zuges für 3 Fokuspunkte eine Minute lang Resistenz gegen alle Schadensarten außer Energie, solange man nicht kampfunfähig wird." },
  { level: 19, name: "Epische Gabe", text: "Ein Talent der Epischen Gaben oder ein anderes passendes Talent." },
  { level: 20, name: "Körper und Geist", text: "Geschicklichkeit und Weisheit steigen um je 4, höchstens auf 25." },
];

export const FOCUS = [
  { name: "Schlaghagel", cost: "1 Fokuspunkt", text: "Bonusaktion: zwei waffenlose Schläge, ab Stufe 10 drei." },
  { name: "Geduldige Verteidigung", cost: "frei oder 1 Fokuspunkt", text: "Bonusaktion Rückzug. Für 1 Fokuspunkt Rückzug und Ausweichen zugleich." },
  { name: "Schritt des Windes", cost: "frei oder 1 Fokuspunkt", text: "Bonusaktion Spurt. Für 1 Fokuspunkt Rückzug und Spurt zugleich, Sprungweite in diesem Zug verdoppelt." },
];

export const OPEN_HAND: Feature[] = [
  { level: 3, name: "Technik der offenen Hand", text: "Trifft ein Schlag des Schlaghagels, eine Wirkung wählen: Verwirren (das Ziel kann bis zum Beginn seines nächsten Zuges keine Gelegenheitsangriffe machen), Stoßen (Stärkerettungswurf, sonst bis zu 4,5 m weggestoßen) oder Umwerfen (Geschicklichkeitsrettungswurf, sonst liegend)." },
  { level: 6, name: "Ganzheit des Körpers", text: "Bonusaktion: Trefferpunkte in Höhe eines Wurfs des Kampfkunstwürfels + Weisheitsmodifikator zurück. Anwendungen gleich Weisheitsmodifikator (mindestens 1) pro langer Rast." },
  { level: 11, name: "Flinker Schritt", text: "Nach einer anderen Bonusaktion sofort zusätzlich Schritt des Windes einsetzen." },
  { level: 17, name: "Bebende Handfläche", text: "Nach einem Treffer mit waffenlosem Schlag für 4 Fokuspunkte Schwingungen im Ziel auslösen. Sie halten Tage in Höhe der Mönchsstufe. Beenden, indem man bei der Aktion Angriff auf einen der Angriffe verzichtet: Konstitutionsrettungswurf, bei Misslingen 10W12 Energieschaden, bei Gelingen die Hälfte." },
];

export const PROFICIENCIES = [
  "Trefferwürfel: W8 pro Stufe",
  "Rettungswürfe: Stärke und Geschicklichkeit",
  "Fertigkeiten: zwei aus Akrobatik, Athletik, Geschichte, Motiv erkennen, Religion, Heimlichkeit",
  "Waffen: einfache Waffen und leichte Kriegswaffen",
  "Werkzeug: ein Handwerkszeug oder ein Musikinstrument",
  "Rüstung: keine",
];
