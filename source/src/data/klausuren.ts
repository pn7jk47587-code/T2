/**
 * Formelbuch: Aufbau, Formeln und Prüfungsmaßstäbe der Klausurtypen im Assessorexamen (Berlin).
 *
 * Schreibweise einer Übung (eine Zeile je Gliederungspunkt):
 *   Einrückung mit je zwei Leerzeichen = Gliederungsebene
 *   {Lücke}            wird abgefragt, {a|b} lässt beide Antworten gelten
 *   Text // Hinweis    der Hinweis erscheint nach der Antwort
 */
export type Gebiet = "zivil" | "straf" | "oeff";
export interface Uebung { id: string; titel: string; fall?: string; text: string }
export interface Klausur { id: string; gebiet: Gebiet; titel: string; unter: string; quelle?: string; uebungen: Uebung[] }

export const GEBIETE: { id: Gebiet; titel: string }[] = [
  { id: "zivil", titel: "Zivilrecht" },
  { id: "straf", titel: "Strafrecht" },
  { id: "oeff", titel: "Öffentliches Recht" },
];

const FALL_ZIVIL = "Die Kauffrau Anna Berg aus Berlin verklagt, vertreten durch Rechtsanwalt Dr. Roth, die Müller Bau GmbH (Geschäftsführer Jens Müller, vertreten durch Rechtsanwältin Kern) auf Zahlung von 12.000 € Kaufpreis nebst Verzugszinsen seit dem 1. Februar 2026. Zuständig ist die Zivilkammer 5 des Landgerichts Berlin II, Geschäftsnummer 5 O 112/26. Es entscheidet Richterin am Landgericht Dr. Sommer als Einzelrichterin. Mündliche Verhandlung am 3. März 2026, Verkündung am 24. März 2026.";
const FALL_OEFF = "Das Bezirksamt Mitte von Berlin untersagt Herrn Karl Vogt mit Bescheid vom 12. Januar 2026 die Ausübung seines Gewerbes (§ 35 Abs. 1 GewO) und ordnet die sofortige Vollziehung an. Den Widerspruch weist es mit Widerspruchsbescheid vom 20. März 2026 zurück. Herr Vogt klagt, vertreten durch Rechtsanwältin Lenz, vor dem Verwaltungsgericht Berlin, Aktenzeichen VG 4 K 112/26. Die 4. Kammer verhandelt am 9. Juni 2026 mündlich.";
const FALL_STRAF = "Die Staatsanwaltschaft Berlin wirft dem 34 Jahre alten Tom Kraus vor, am 3. Januar 2026 in Berlin in einem Kaufhaus eine Jacke im Wert von 180 € entwendet zu haben. Die Hauptverhandlung findet am 3. März 2026 vor dem Amtsgericht Tiergarten statt, Strafrichterin ist Richterin am Amtsgericht Dr. Falk. Verteidiger ist Rechtsanwalt Braun.";

export const KLAUSUREN: Klausur[] = [
  /* ───────────── Zivilrecht ───────────── */
  {
    id: "z-urteil", quelle: "KG-Skript Zivilrecht, staatliche Sicht", gebiet: "zivil", titel: "Urteilsklausur", unter: "Zivilurteil erster Instanz",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
{Rubrum|Kopf des Urteils} // § 313 Abs. 1 Nr. 1 bis 3 ZPO
{Urteilsformel|Tenor} // § 313 Abs. 1 Nr. 4 ZPO
  1. {Hauptsacheentscheidung}
  2. {Kostenentscheidung} // von Amts wegen, § 308 Abs. 2 ZPO
  3. {Vorläufige Vollstreckbarkeit} // §§ 708 ff. ZPO
{Tatbestand} // § 313 Abs. 1 Nr. 5, Abs. 2 ZPO; ein Einleitungssatz nur, wenn er zum Verständnis nötig ist
  {Geschichtserzählung|Unstreitiger Sachverhalt|Sachstand} // Präteritum, Indikativ
  {Streitiger Vortrag des Klägers|Streitiger Klägervortrag} // indirekte Rede
  {Anträge} // aktuelle Anträge beider Parteien, Präsens, Indikativ
  {Streitiger Vortrag des Beklagten|Streitiger Beklagtenvortrag} // indirekte Rede
  {Prozessgeschichte} // Beweisaufnahme mit Verweis auf die Sitzungsniederschrift, beigezogene Akten
{Entscheidungsgründe} // § 313 Abs. 1 Nr. 6, Abs. 3 ZPO, Urteilsstil
  {Einleitungssatz mit dem Ergebnis} // „Die zulässige Klage ist begründet.“
  I. {Zulässigkeit} // nur, was problematisch ist
  II. {Begründetheit}
    1. {Hauptanspruch|Hauptforderung} // nur die am leichtesten begründbare Anspruchsgrundlage
    2. {Nebenforderungen}
  III. {Prozessuale Nebenentscheidungen} // Kosten, vorläufige Vollstreckbarkeit, Zulassung von Rechtsmitteln
{Rechtsbehelfsbelehrung} // § 232 ZPO: nur ohne Anwaltszwang; in der Klausur meist erlassen
{Unterschriften} // decken auch die Rechtsbehelfsbelehrung` },
      { id: "rubrum", titel: "Rubrum", fall: FALL_ZIVIL, text: `
{Landgericht Berlin II}
5 O 112/26 // Aktenzeichen oben links; kein Verkündungsvermerk, den fertigt der Urkundsbeamte
{Im Namen des Volkes} // § 311 Abs. 1 ZPO; die Überschrift „Urteil“ ist üblich, zwingend nur bei besonderen Urteilsarten
In dem {Rechtsstreit}
{der Frau Anna Berg}, {Wohnort}, // Vor- und Nachname und Wohnort; Beruf nur, wenn sie unter einer Firma klagt (KG-Skript B.II.1 und 4)
{Klägerin}, // Parteistellung rechtsbündig unter der Partei
{Prozessbevollmächtigter}: Rechtsanwalt Dr. Roth, [Anschrift],
{gegen}
die Müller Bau GmbH, {gesetzlich vertreten durch den Geschäftsführer|vertreten durch den Geschäftsführer} Jens Müller, [Anschrift],
{Beklagte},
Prozessbevollmächtigte: Rechtsanwältin Kern, [Anschrift],
hat das Landgericht Berlin II, {Zivilkammer 5}, // Reihenfolge nach § 313 Abs. 1 ZPO: Gericht, Richter, letzter Tag
durch die {Richterin am Landgericht} Dr. Sommer als {Einzelrichterin}
auf die {mündliche Verhandlung} vom {3. März 2026} // nicht der Tag der Verkündung
{für Recht erkannt}:` },
      { id: "tenor", titel: "Tenor", fall: FALL_ZIVIL + " Die Klage hat in vollem Umfang Erfolg.", text: `
1. Die Beklagte wird {verurteilt}, an die Klägerin 12.000 € nebst Zinsen in Höhe von {neun Prozentpunkten über dem jeweiligen Basiszinssatz|9 Prozentpunkten über dem jeweiligen Basiszinssatz|neun Prozentpunkten über dem Basiszinssatz} seit dem 1. Februar 2026 zu zahlen. // Entgeltforderung ohne Verbraucher, § 288 Abs. 2 BGB; sonst fünf Prozentpunkte, § 288 Abs. 1 BGB
2. Die Beklagte hat die {Kosten des Rechtsstreits} zu tragen. // § 91 Abs. 1 S. 1 ZPO
3. Das Urteil ist {gegen Sicherheitsleistung in Höhe des jeweils zu vollstreckenden Betrages zuzüglich 10 %|gegen Sicherheitsleistung in Höhe von 110 % des jeweils zu vollstreckenden Betrages} vorläufig vollstreckbar. // § 709 S. 1 und 2 ZPO
Bei voller Klageabweisung lautet die Hauptsache: {Die Klage wird abgewiesen.}
Norm der Kostenentscheidung bei vollem Unterliegen: {§ 91 Abs. 1 S. 1 ZPO}
Vorläufige Vollstreckbarkeit ohne Sicherheitsleistung mit Abwendungsbefugnis: {§§ 708 Nr. 11, 711 ZPO}
Der Tenor muss vollstreckungsfähig, knapp und {erschöpfend} sein.` },
    ],
  },
  {
    id: "z-beschluss", gebiet: "zivil", titel: "Beschlussklausur", unter: "Zivilgerichtlicher Beschluss",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
{Rubrum} // Überschrift „Beschluss“, ohne „Im Namen des Volkes“
{Tenor} // eingeleitet mit „beschlossen:“
  1. {Sachentscheidung}
  2. {Kostenentscheidung} // nur soweit eine Kostengrundentscheidung veranlasst ist
  3. {Streitwert|Verfahrenswert} // soweit festzusetzen
{Gründe}
  I. {Sachverhalt} // entspricht dem Tatbestand
  II. {Rechtliche Würdigung} // entspricht den Entscheidungsgründen
    1. {Zulässigkeit}
    2. {Begründetheit}
    3. {Nebenentscheidungen}
{Rechtsbehelfsbelehrung} // § 232 ZPO
{Unterschriften}
Ein Ausspruch zur vorläufigen Vollstreckbarkeit {entfällt}. // Beschlüsse sind Vollstreckungstitel nach § 794 Abs. 1 Nr. 3 ZPO` },
      { id: "rubrum", titel: "Rubrum", fall: "Anna Berg beantragt, vertreten durch Rechtsanwalt Dr. Roth, beim Landgericht Berlin II den Erlass einer einstweiligen Verfügung gegen die Müller Bau GmbH. Die Zivilkammer 5 entscheidet am 3. März 2026 ohne mündliche Verhandlung durch die Vorsitzende Richterin am Landgericht Dr. Sommer, den Richter am Landgericht Haas und die Richterin Voigt.", text: `
{Landgericht Berlin II}
{Beschluss}
In dem {einstweiligen Verfügungsverfahren|Verfahren auf Erlass einer einstweiligen Verfügung}
der Frau Anna Berg, [Anschrift],
{Antragstellerin},
{Verfahrensbevollmächtigter}: Rechtsanwalt Dr. Roth, [Anschrift],
gegen
die Müller Bau GmbH, vertreten durch den Geschäftsführer Jens Müller, [Anschrift],
{Antragsgegnerin},
hat die Zivilkammer 5 des Landgerichts Berlin II {am 3. März 2026}
durch die Vorsitzende Richterin am Landgericht Dr. Sommer, den Richter am Landgericht Haas und die Richterin Voigt
{beschlossen}:` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Einstweilige Verfügung, erste Voraussetzung: {Verfügungsanspruch}
Einstweilige Verfügung, zweite Voraussetzung: {Verfügungsgrund} // §§ 935, 940 ZPO
Beweismaß im Eilverfahren: {Glaubhaftmachung} // §§ 936, 920 Abs. 2, 294 ZPO
Arrest sichert die Zwangsvollstreckung wegen einer {Geldforderung}. // § 916 ZPO
Prozesskostenhilfe: {hinreichende Aussicht auf Erfolg}, keine Mutwilligkeit, Bedürftigkeit // § 114 Abs. 1 S. 1 ZPO
Übereinstimmende Erledigung: Kosten nach {billigem Ermessen} unter Berücksichtigung des bisherigen Sach- und Streitstandes // § 91a Abs. 1 S. 1 ZPO
Frist der sofortigen Beschwerde: {zwei Wochen} // § 569 Abs. 1 S. 1 ZPO` },
    ],
  },
  {
    id: "z-relation", gebiet: "zivil", titel: "Relationsklausur", unter: "Gutachten mit Entscheidungsentwurf",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
A. {Sachbericht} // nur, wenn der Bearbeitervermerk ihn verlangt
B. {Gutachten}
  {Entscheidungsvorschlag} // dem Gutachten vorangestellt
  I. {Prozessstation} // Zulässigkeit der Klage
  II. {Klägerstation} // Schlüssigkeit
  III. {Beklagtenstation} // Erheblichkeit
  IV. {Beweisstation}
    1. {Beweisbedürftigkeit} // Welche erheblichen Tatsachen sind streitig?
    2. {Beweislast}
    3. {Beweiswürdigung} // oder Beweisbeschluss, wenn noch Beweis zu erheben ist
  V. {Tenorierungsstation} // Hauptsache, Kosten, vorläufige Vollstreckbarkeit
C. {Entscheidungsentwurf} // Urteil oder Beweisbeschluss` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Klägerstation: Rechtfertigt der Tatsachenvortrag des Klägers, {als wahr unterstellt}, den Klageantrag?
Diese Prüfung heißt {Schlüssigkeit}.
Beklagtenstation: Ist der Vortrag des Beklagten, als wahr unterstellt, geeignet, die Klage ganz oder teilweise zu Fall zu bringen? Diese Prüfung heißt {Erheblichkeit}.
Beweis wird nur erhoben über Tatsachen, die {streitig} und {entscheidungserheblich|erheblich} sind.
Nicht bestrittene Tatsachen gelten als {zugestanden}. // § 138 Abs. 3 ZPO
Maß der richterlichen Überzeugung: {freie Beweiswürdigung} // § 286 Abs. 1 ZPO
Bleibt eine Tatsache unaufklärbar, entscheidet die {Beweislast}. // non liquet` },
    ],
  },
  {
    id: "z-anwalt", quelle: "Skript zur zivilrechtlichen Anwaltsklausur (2023)", gebiet: "zivil", titel: "Anwaltsklausur", unter: "Kläger, Beklagter, Eilrechtsschutz, Rechtsmittel",
    uebungen: [
      { id: "klaeger", titel: "Aufbau Klägerseite", text: `
1. {Mandantenbegehren} // Zielvorstellung präzise, ohne das Ergebnis vorwegzunehmen
2. {Gutachten} // Einstieg direkt mit der materiellen Prüfung, keine prozessualen Erwägungen
  {Anspruchsgrundlagen} // Kann der Anspruch schlüssig dargelegt werden?
  {Einwendungen und Einreden des Gegners} // erheblich oder nicht?
  {Beweisprognose} // Beweislast, verfügbare Beweismittel, deren Gewicht
3. {Zweckmäßigkeitserwägungen} // Brücke zwischen Gutachten und praktischer Leistung
  {Zulässigkeit der Klage} // gehört in der Klägerklausur hierher, vor allem die Zuständigkeit
  {Vorgehen und Prozesstaktik} // Kosten, Eilbedürfnis, Streitverkündung, Mahnverfahren
4. {Praktische Leistung} // Schriftsatz an das Gericht, sonst Mandantenschreiben
Technik, mit der Gutachtenpassagen in den Schriftsatz übernommen werden: {Spitzklammertechnik}` },
      { id: "beklagter", titel: "Aufbau Beklagtenseite", text: `
1. {Mandantenbegehren}
2. {Gutachten}
  {Zulässigkeit der Klage} // in der Beklagtenklausur voranzustellen
  {Begründetheit der Klage}
    {Schlüssigkeit des Klägervortrags}
    {Erheblichkeit der Einlassung des Mandanten|Erheblichkeit des Mandantenvortrags} // auch bei Zweifeln an der Schlüssigkeit vorsorglich erheblich einwenden
    {Beweisprognose}
  {Gegenansprüche des Mandanten} // nur materiell-rechtlich; Aufrechnung, Zurückbehaltungsrecht
3. {Zweckmäßigkeitserwägungen} // Widerklage, Hilfsaufrechnung, Anerkenntnis, Fristen
4. {Praktische Leistung} // Klageerwiderung, gegebenenfalls mit Widerklage` },
      { id: "eil", titel: "Aufbau einstweiliger Rechtsschutz", text: `
1. {Mandantenbegehren}
2. {Gutachten}
  {Verfügungsanspruch}
  {Verfügungsgrund} // Dringlichkeit, kein zögerliches Verhalten des Mandanten
  {Glaubhaftmachung} // §§ 936, 920 Abs. 2, 294 ZPO, vor allem eidesstattliche Versicherung
  {Keine Vorwegnahme der Hauptsache}
3. {Zweckmäßigkeitserwägungen}
  {Statthafter Rechtsbehelf} // Arrest (§ 916 ZPO) oder einstweilige Verfügung (§§ 935, 940 ZPO)
  {Zuständiges Gericht} // Gericht der Hauptsache, §§ 937 Abs. 1, 943 ZPO
  {Risiken} // Vollziehungsfrist § 929 Abs. 2 ZPO, Schadensersatz § 945 ZPO
4. {Praktische Leistung} // Antragsschrift
Parteibezeichnung im Eilverfahren: {Antragsteller} und {Antragsgegner}` },
      { id: "berufung", titel: "Aufbau Berufung", text: `
1. {Mandantenbegehren}
2. {Gutachten} // bei Rechtsmitteln beginnt das Gutachten mit der Zulässigkeit
  I. {Zulässigkeit der Berufung}
    1. {Statthaftigkeit} // § 511 Abs. 1 ZPO: Endurteile erster Instanz
    2. {Beschwer|Wert des Beschwerdegegenstandes} // § 511 Abs. 2 ZPO: über 1.000 € (seit 1.1.2026) oder Zulassung
    3. {Form und Frist der Einlegung} // §§ 517, 519 ZPO: ein Monat ab Zustellung
    4. {Form und Frist der Begründung} // § 520 ZPO: zwei Monate ab Zustellung
  II. {Begründetheit der Berufung} // § 513 Abs. 1 ZPO
    1. {Rechtsverletzung} // §§ 513 Abs. 1 Alt. 1, 546 ZPO
    2. {Andere Tatsachengrundlage} // §§ 513 Abs. 1 Alt. 2, 529, 531 ZPO
3. {Zweckmäßigkeitserwägungen} // Kostenrisiko, Anschlussberufung § 524 ZPO, Einstellung der Zwangsvollstreckung §§ 719, 707 ZPO
4. {Praktische Leistung} // Berufungsschrift mit Berufungsbegründung` },
      { id: "klageschrift", titel: "Klageschrift", fall: FALL_ZIVIL, text: `
Kanzlei, per beA, Datum
{Landgericht Berlin II}
{Klage}
der Frau Anna Berg, [Anschrift],
{Klägerin},
{Prozessbevollmächtigter}: Rechtsanwalt Dr. Roth,
gegen
die Müller Bau GmbH, gesetzlich vertreten durch den Geschäftsführer Jens Müller, [Anschrift],
{Beklagte},
wegen: {Kaufpreisforderung}
voraussichtlicher {Streitwert}: 12.000 €
Hiermit erhebe ich {namens und in Vollmacht} der Klägerin Klage und werde {beantragen}, wie folgt zu erkennen:
Die Beklagte wird {verurteilt}, an die Klägerin 12.000 € nebst Zinsen in Höhe von neun Prozentpunkten über dem jeweiligen Basiszinssatz seit dem 1. Februar 2026 zu zahlen.
Für den Fall der Säumnis im Sinne des {§ 331 Abs. 3 ZPO} wird bereits jetzt beantragt, die Beklagte antragsgemäß durch {Versäumnisurteil} zu verurteilen. // stets zu stellen
{Begründung}
{Sachverhalt} // jede streitige Tatsache mit Beweisantritt
{Rechtliche Würdigung}
Was nicht beantragt ist, wird nicht zugesprochen: {§ 308 ZPO|§ 308 Abs. 1 ZPO}` },
    ],
  },
  {
    id: "z-kautelar", quelle: "Skript zur zivilrechtlichen Anwaltsklausur (2023)", gebiet: "zivil", titel: "Kautelarklausur", unter: "Vertragsgestaltung",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
1. {Mandantenbegehren|Zielbestimmung} // Ziele herausarbeiten, wenn der Mandant keine genaue Vorstellung hat
2. {Gutachten} // gutachterlicher Vermerk zur Rechtslage
  {Rechtliche Ausgangslage} // Was gilt ohne die Gestaltung?
  {Gestaltungsmöglichkeiten} // mit Risiken und Folgen einer Eskalation
  {Grenzen der Gestaltung} // zwingendes Recht, AGB-Kontrolle, Formvorschriften
3. {Vorschlag zum Vorgehen|Zweckmäßigkeitserwägungen}
4. {Praktische Leistung} // einzelne Klauseln, seltener ein ganzer Vertrag, auch Kündigung, Widerruf, Testament
5. {Mandantenschreiben} // erklärt dem Mandanten die Gestaltung
Aufbau eines Vertrags
{Rubrum} // Parteien mit Vertretungsverhältnissen und einheitlicher Kurzbezeichnung
{Präambel} // allgemeine Situation als Geschäftsgrundlage
{Vertragsgegenstand}
{Leistung und Gegenleistung}
{Haftung und Gewährleistung}
{Vertragsbeendigung}
{Schlussbestimmungen} // Gerichtsstand, Schriftform, salvatorische Klausel
Ordnungsprinzip des Vertrags: vom {Allgemeinen zum Besonderen} // Klammerprinzip, Verweise nur nach oben` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Leitlinie der Gestaltung: der {sicherste Weg} // Gebot des sichersten und gefahrlosesten Weges
Inhaltskontrolle vorformulierter Klauseln: {§§ 305 ff. BGB}
Grundstücksgeschäft, Form: {notarielle Beurkundung} // § 311b Abs. 1 S. 1 BGB
Folge eines Formmangels: {Nichtigkeit} // § 125 S. 1 BGB
Unwirksame AGB-Klausel: Der Vertrag bleibt im Übrigen {wirksam}. // § 306 Abs. 1 BGB
Eine geltungserhaltende Reduktion unwirksamer AGB ist {unzulässig}.` },
    ],
  },

  /* ───────────── Strafrecht ───────────── */
  {
    id: "s-sta", gebiet: "straf", titel: "Staatsanwaltliche Klausur", unter: "Gutachten, Abschlussverfügung, Anklageschrift",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
A. {Materiell-rechtliches Gutachten} // Maßstab: hinreichender Tatverdacht
  {Tatkomplexe} // chronologisch, je Beschuldigtem und Delikt
    1. {Tatbestand} // mit Beweiswürdigung und Verwertbarkeit der Beweismittel
    2. {Rechtswidrigkeit}
    3. {Schuld}
    4. {Strafantrag und Verfolgungsvoraussetzungen}
  {Konkurrenzen}
B. {Prozessuales Gutachten}
  I. {Abschlussentscheidung} // Anklage, Strafbefehl, Einstellung § 170 Abs. 2, §§ 153 ff., 154, 154a StPO
  II. {Zuständiges Gericht} // sachlich §§ 24, 25, 28, 74 GVG, örtlich §§ 7 ff. StPO
  III. {Haft und Zwangsmaßnahmen} // §§ 112 ff., 111a StPO
  IV. {Notwendige Verteidigung} // § 140 StPO
  V. {Nebenentscheidungen} // Einziehung, Nebenklage, Mitteilungen
C. {Abschlussverfügung}
D. {Anklageschrift}` },
      { id: "verfuegung", titel: "Abschlussverfügung", fall: FALL_STRAF + " Ein weiterer Vorwurf der Sachbeschädigung, den die Zeugin Lang angezeigt hat, lässt sich nicht nachweisen.", text: `
Staatsanwaltschaft Berlin, Aktenzeichen, Datum
{Vfg.|Verfügung}
1. {Die Ermittlungen sind abgeschlossen.} // § 169a StPO
2. {Einstellung} des Verfahrens wegen Sachbeschädigung gemäß {§ 170 Abs. 2 StPO} mit Gründen
3. {Einstellungsbescheid} an die Anzeigende Lang // § 171 StPO, mit Belehrung über die Beschwerde, wenn sie Verletzte ist
4. {Einstellungsnachricht} an den Beschuldigten // § 170 Abs. 2 S. 2 StPO
5. {Anklageschrift} nach Entwurf fertigen
6. {U. m. A.|Urschriftlich mit Akten} dem Amtsgericht Tiergarten, Strafrichter, mit dem Antrag aus der Anklageschrift
7. {Wiedervorlage} mit Frist
Unterschrift, Dienstbezeichnung` },
      { id: "anklage", titel: "Anklageschrift", fall: FALL_STRAF, text: `
Staatsanwaltschaft Berlin, Aktenzeichen
An das {Amtsgericht Tiergarten}, {Strafrichter}
{Anklageschrift}
{Personalien}: Der Tom Kraus, geboren am … in …, wohnhaft …, deutscher Staatsangehöriger,
Verteidiger: Rechtsanwalt Braun
wird {angeklagt},
in Berlin am 3. Januar 2026 // Tatort und Tatzeit
{eine fremde bewegliche Sache einem anderen in der Absicht weggenommen zu haben, die Sache sich rechtswidrig zuzueignen} // abstrakter Anklagesatz: gesetzliche Merkmale der Tat
{Dem Angeschuldigten wird Folgendes zur Last gelegt:} // danach der konkrete Anklagesatz
{Vergehen}, strafbar nach {§ 242 Abs. 1 StGB}
{Beweismittel} // Einlassung, Zeugen, Sachverständige, Urkunden, Augenschein
{Wesentliches Ergebnis der Ermittlungen} // darf bei Anklage zum Strafrichter entfallen, § 200 Abs. 2 S. 2 StPO
Es wird beantragt, das {Hauptverfahren zu eröffnen} und die Anklage zur Hauptverhandlung vor dem Amtsgericht Tiergarten, Strafrichter, {zuzulassen}. // § 199 Abs. 2 S. 1 StPO
Bezeichnung des Betroffenen in der Anklageschrift: {Angeschuldigter} // § 157 StPO` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Anklage setzt {hinreichenden Tatverdacht} voraus. // §§ 170 Abs. 1, 203 StPO
Das bedeutet: Eine Verurteilung ist {wahrscheinlicher als ein Freispruch|überwiegend wahrscheinlich}.
Einleitung von Ermittlungen: {Anfangsverdacht}, also zureichende tatsächliche Anhaltspunkte // § 152 Abs. 2 StPO
Haftbefehl: {dringender Tatverdacht} und Haftgrund // § 112 Abs. 1 S. 1 StPO
Fehlt der hinreichende Tatverdacht, wird nach {§ 170 Abs. 2 StPO} eingestellt.
Strafrichter: Straferwartung bis {zwei Jahre} Freiheitsstrafe bei Vergehen // § 25 Nr. 2 GVG
Schöffengericht: Strafgewalt bis {vier Jahre} Freiheitsstrafe // § 24 Abs. 2 GVG` },
    ],
  },
  {
    id: "s-revision", quelle: "Revisionsskript (2023)", gebiet: "straf", titel: "Revisionsklausur", unter: "Gerichtliches oder anwaltliches Gutachten",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
A. {Zulässigkeit}
  I. {Gerichtszuständigkeit}
  II. {Zulässigkeitsvoraussetzungen der Revision}
    1. {Statthaftigkeit} // §§ 333, 335 StPO
    2. {Revisionsberechtigter|Revisionsberechtigung}
    3. {Beschwer}
    4. {Ordnungsgemäße Revisionseinlegung|Revisionseinlegung} // § 341 StPO: Anfechtungserklärung, Adressat, Form, Frist
    5. {Ordnungsgemäße Revisionsbegründung|Revisionsbegründung} // § 345 StPO: Adressat, Form, Frist
B. {Begründetheit der Revision}
  I. {Prozessvoraussetzungen|Verfahrenshindernisse} // von Amts wegen zu prüfen
  II. {Verfahrensrügen}
    1. {Absolute Revisionsgründe} // § 338 StPO
    2. {Relative Revisionsgründe} // § 337 StPO
  III. {Sachrüge}
    1. {Fehler bei der rechtlichen Würdigung|Subsumtionsfehler}
    2. {Fehler bei der Beweiswürdigung} // fehlend, widersprüchlich, Verstoß gegen Denkgesetze, in dubio pro reo
    3. {Fehler bei der Bildung der Strafe|Fehler bei der Strafzumessung}
C. {Revisionsanträge} // § 344 Abs. 1 StPO` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Die Revision kann nur auf eine {Verletzung des Gesetzes} gestützt werden. // § 337 Abs. 1 StPO
Relativer Revisionsgrund: Das Urteil muss auf dem Fehler {beruhen}. // § 337 Abs. 1 StPO
Beruhen heißt: Es ist {nicht auszuschließen}, dass das Urteil ohne den Fehler anders ausgefallen wäre.
Bei absoluten Revisionsgründen wird das Beruhen {unwiderleglich vermutet}. // § 338 StPO
Beweis der Verfahrensvorgänge in der Hauptverhandlung: {Sitzungsprotokoll|Protokoll} // § 274 StPO
Verfahrensrüge: Die den Mangel enthaltenden {Tatsachen} müssen angegeben werden. // § 344 Abs. 2 S. 2 StPO
Grundlage der Sachrüge ist allein die {Urteilsurkunde}.
Einlegungsfrist: {eine Woche} // § 341 Abs. 1 StPO
Begründungsfrist: {ein Monat} // § 345 Abs. 1 StPO, verlängert bei spät abgesetzten Urteilen` },
    ],
  },
  {
    id: "s-urteil", gebiet: "straf", titel: "Strafurteil", unter: "Strafgerichtliche Urteilsklausur",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
{Rubrum|Urteilskopf} // § 275 Abs. 3 StPO
{Urteilsformel|Tenor} // § 260 Abs. 4 StPO
  {Schuldspruch}
  {Rechtsfolgenausspruch} // Strafe, Bewährung, Maßregeln, Einziehung
  {Kostenentscheidung} // §§ 464, 465, 467 StPO
{Liste der angewendeten Vorschriften} // § 260 Abs. 5 StPO
{Gründe} // § 267 StPO
  I. {Persönliche Verhältnisse}
  II. {Feststellungen zur Sache|Sachverhalt}
  III. {Beweiswürdigung}
  IV. {Rechtliche Würdigung}
  V. {Strafzumessung} // Strafrahmen, Zumessung im engeren Sinn, Gesamtstrafe, Bewährung
  VI. {Kosten und Nebenentscheidungen}
{Unterschriften} // § 275 Abs. 2 StPO` },
      { id: "rubrum", titel: "Rubrum", fall: FALL_STRAF, text: `
{Amtsgericht Tiergarten}
{Im Namen des Volkes}
{Urteil}
In der {Strafsache}
gegen Tom Kraus, geboren am …, wohnhaft …,
wegen {Diebstahls}
hat das Amtsgericht Tiergarten, {Strafrichter},
in der {Hauptverhandlung} vom 3. März 2026, an der teilgenommen haben:
Richterin am Amtsgericht Dr. Falk als {Strafrichterin},
Staatsanwalt … als {Beamter der Staatsanwaltschaft},
Rechtsanwalt Braun als {Verteidiger},
Justizsekretärin … als {Urkundsbeamtin der Geschäftsstelle},
{für Recht erkannt}:` },
      { id: "tenor", titel: "Tenor", fall: FALL_STRAF, text: `
Verurteilung: Der Angeklagte wird wegen {Diebstahls} zu einer {Geldstrafe von 40 Tagessätzen zu je 30 €|Geldstrafe von 40 Tagessätzen zu je 30 Euro} verurteilt. // angenommene Strafe
Kosten bei Verurteilung: Der Angeklagte trägt die {Kosten des Verfahrens}. // § 465 Abs. 1 StPO
Freispruch: Der Angeklagte wird {freigesprochen}.
Kosten bei Freispruch: Die Kosten des Verfahrens und die {notwendigen Auslagen} des Angeklagten trägt die {Staatskasse|Landeskasse}. // § 467 Abs. 1 StPO
Überzeugungsmaßstab des Gerichts: {freie Beweiswürdigung} aus dem Inbegriff der Verhandlung // § 261 StPO
Bleiben Zweifel an der Schuld, gilt der Grundsatz {in dubio pro reo|im Zweifel für den Angeklagten}.` },
    ],
  },
  {
    id: "s-verteidiger", quelle: "Skript zur strafrechtlichen Anwaltsklausur (12/2023)", gebiet: "straf", titel: "Verteidigerklausur", unter: "Gutachten mit Plädoyer",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
A. {Gutachten}
  {Chronologische Prüfung jeder prozessualen Tat} // vollständig, nicht erst die angeklagten und dann die übersehenen Tatbestände
  {Beweiswürdigung und Verwertungsverbote am jeweiligen Tatbestandsmerkmal} // kein getrennter prozessualer Teil
  {Gesonderte prozessuale Fragen} // nur was sich nicht einfügen lässt: Zulässigkeit eines Rechtsbehelfs, Wiedereinsetzung, Zusatzfragen
B. {Verteidigungsziel} // gedankliche Vorarbeit, nicht an den Anfang des Schriftsatzes
  {Nichtverurteilung|Freispruchverteidigung}
  {Möglichst geringe Sanktion|Strafzumessungsverteidigung}
C. {Anwaltliche Leistung} // Plädoyer, Schriftsatz oder Mandantenschreiben
Aufbau des Plädoyers
{Anrede} // „Hohes Gericht, sehr geehrte Frau Staatsanwältin,“
{Ergebnis der Beweisaufnahme}
{Beweiswürdigung} // nur was dem Mandanten nützt und worauf es ankommt
{Rechtliche Würdigung}
{Strafzumessung} // hilfsweise bei Freispruchverteidigung
{Anträge}` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Drei Rechtsgründe führen zur Nichtverurteilung. Erstens: {Nichtbeweisbarkeit der Tatvorwürfe|Nichtbeweisbarkeit} // etwa bei Verwertungsverboten
Zweitens: {Straflosigkeit des Verhaltens|Straflosigkeit} // etwa bei fehlerhafter Subsumtion
Drittens: {Verfahrenshindernisse} // etwa fehlender oder unwirksamer Strafantrag
Der Sachverhalt wird nicht unter allen Gesichtspunkten geprüft, sondern nur im {Interesse des Mandanten}.
Verwertungsverbot wegen unterbliebener Belehrung nach {§ 136 Abs. 1 S. 2 StPO} setzt einen rechtzeitigen {Widerspruch} der Verteidigung voraus.
Auf ein Verwertungsverbot wird im Plädoyer nur eingegangen, wenn es auf das Beweismittel {ankommt}.
Verbleibende Zweifel wirken nach dem {Zweifelsgrundsatz|Grundsatz in dubio pro reo|in dubio pro reo}.` },
    ],
  },

  /* ───────────── Öffentliches Recht ───────────── */
  {
    id: "o-urteil", gebiet: "oeff", titel: "Verwaltungsgerichtliches Urteil", unter: "Urteil des Verwaltungsgerichts",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
{Rubrum}
{Tenor}
  {Hauptsacheentscheidung}
  {Kostenentscheidung} // §§ 154 ff. VwGO
  {Vorläufige Vollstreckbarkeit} // § 167 VwGO mit §§ 708 ff. ZPO
{Tatbestand} // § 117 Abs. 2 Nr. 5, Abs. 3 VwGO
  {Einleitungssatz}
  {Unstreitiger Sachverhalt}
  {Verwaltungsverfahren} // Antrag, Bescheid, Widerspruch, Widerspruchsbescheid mit Daten
  {Klageerhebung und Vortrag des Klägers}
  {Anträge}
  {Vortrag des Beklagten}
  {Prozessgeschichte} // Beiladung, Beweisaufnahme, beigezogene Verwaltungsvorgänge
{Entscheidungsgründe}
  {Vorfragen} // Einzelrichter § 6 VwGO, Entscheidung ohne mündliche Verhandlung § 101 Abs. 2 VwGO, Auslegung des Begehrens § 88 VwGO
  I. {Zulässigkeit} // nur Problematisches
  II. {Begründetheit}
    1. {Ermächtigungsgrundlage}
    2. {Formelle Rechtmäßigkeit}
    3. {Materielle Rechtmäßigkeit}
    4. {Rechtsverletzung}
  III. {Nebenentscheidungen} // Kosten, vorläufige Vollstreckbarkeit, Berufungszulassung
{Rechtsmittelbelehrung} // Antrag auf Zulassung der Berufung, § 124a Abs. 4 VwGO
{Unterschriften}` },
      { id: "rubrum", titel: "Rubrum", fall: FALL_OEFF, text: `
VG 4 K 112/26
{Verwaltungsgericht Berlin}
{Urteil}
{Im Namen des Volkes}
In der {Verwaltungsstreitsache}
des Herrn Karl Vogt, [Anschrift],
{Klägers},
{Verfahrensbevollmächtigte}: Rechtsanwältin Lenz, [Anschrift],
gegen
{das Land Berlin}, {vertreten durch das Bezirksamt Mitte von Berlin}, [Anschrift], // Rechtsträgerprinzip, § 78 Abs. 1 Nr. 1 VwGO
{Beklagten},
hat das Verwaltungsgericht Berlin, {4. Kammer},
{aufgrund der mündlichen Verhandlung} vom 9. Juni 2026 durch
den Vorsitzenden Richter am Verwaltungsgericht …, die Richterin am Verwaltungsgericht …, den Richter …,
die {ehrenamtliche Richterin} … und den ehrenamtlichen Richter …
{für Recht erkannt}:` },
      { id: "tenor", titel: "Tenor", fall: FALL_OEFF + " Die Anfechtungsklage hat Erfolg.", text: `
Der Bescheid des Bezirksamts Mitte von Berlin vom 12. Januar 2026 {in der Gestalt des Widerspruchsbescheides} vom 20. März 2026 wird {aufgehoben}. // § 79 Abs. 1 Nr. 1, § 113 Abs. 1 S. 1 VwGO
Der Beklagte trägt die {Kosten des Verfahrens}. // § 154 Abs. 1 VwGO
Das Urteil ist {wegen der Kosten} vorläufig vollstreckbar. // § 167 Abs. 2 VwGO
Der Beklagte darf die Vollstreckung durch {Sicherheitsleistung} in Höhe von 110 % des aufgrund des Urteils vollstreckbaren Betrages abwenden, wenn nicht der Kläger vor der Vollstreckung Sicherheit in Höhe von 110 % des jeweils zu vollstreckenden Betrages leistet. // § 167 VwGO, §§ 708 Nr. 11, 711 ZPO
Bei Erfolglosigkeit lautet die Hauptsache: {Die Klage wird abgewiesen.}
Verpflichtungsurteil bei Spruchreife: Der Beklagte wird {verpflichtet}, dem Kläger die Genehmigung zu erteilen. // § 113 Abs. 5 S. 1 VwGO
Fehlt die Spruchreife: Verpflichtung, den Kläger unter Beachtung der {Rechtsauffassung des Gerichts} neu zu bescheiden. // § 113 Abs. 5 S. 2 VwGO` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Die Anfechtungsklage ist begründet, soweit der Verwaltungsakt {rechtswidrig} und der Kläger dadurch {in seinen Rechten verletzt} ist. // § 113 Abs. 1 S. 1 VwGO
Die Verpflichtungsklage setzt zusätzlich die {Spruchreife} voraus. // § 113 Abs. 5 S. 1 VwGO
Ermessensentscheidungen prüft das Gericht nur auf {Ermessensfehler}. // § 114 S. 1 VwGO
Maßgeblicher Zeitpunkt der Anfechtungsklage im Grundsatz: {letzte Behördenentscheidung}
Maßgeblicher Zeitpunkt der Verpflichtungsklage im Grundsatz: {letzte mündliche Verhandlung}
Das Gericht darf über das Klagebegehren nicht hinausgehen, ist aber an die Fassung der {Anträge} nicht gebunden. // § 88 VwGO
Das Gericht erforscht den Sachverhalt {von Amts wegen}. // § 86 Abs. 1 VwGO
Klagefrist: {ein Monat} nach Zustellung des Widerspruchsbescheides // § 74 Abs. 1 S. 1 VwGO` },
    ],
  },
  {
    id: "o-beschluss", gebiet: "oeff", titel: "Beschluss im vorläufigen Rechtsschutz", unter: "§ 80 Abs. 5 und § 123 VwGO",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
{Rubrum} // „Beschluss“, ohne „Im Namen des Volkes“, Antragsteller und Antragsgegner
{Tenor} // eingeleitet mit „beschlossen:“
  {Sachentscheidung}
  {Kostenentscheidung}
  {Streitwertfestsetzung} // §§ 52, 53 Abs. 2 GKG
{Gründe}
  I. {Sachverhalt}
  II. {Rechtliche Würdigung}
    1. {Zulässigkeit} // Abgrenzung § 80 Abs. 5 und § 123 VwGO über § 123 Abs. 5 VwGO
    2. {Begründetheit}
    3. {Nebenentscheidungen}
{Rechtsmittelbelehrung} // Beschwerde, §§ 146, 147 VwGO
{Unterschriften}
Ein Ausspruch zur vorläufigen Vollstreckbarkeit {entfällt}. // § 149 VwGO: Die Beschwerde hat grundsätzlich keine aufschiebende Wirkung` },
      { id: "p80", titel: "Begründetheit § 80 Abs. 5", text: `
1. {Formelle Rechtmäßigkeit der Vollziehungsanordnung} // nur im Fall des § 80 Abs. 2 S. 1 Nr. 4 VwGO
  {Zuständigkeit}
  {Begründung} // § 80 Abs. 3 S. 1 VwGO: schriftlich, auf den Einzelfall bezogen
2. {Interessenabwägung}
  {Erfolgsaussichten in der Hauptsache} // summarische Prüfung der Rechtmäßigkeit des Verwaltungsakts
  {Besonderes Vollzugsinteresse} // im Fall der Nr. 4 zusätzlich erforderlich
Tenor bei behördlich angeordnetem Sofortvollzug: Die aufschiebende Wirkung wird {wiederhergestellt}. // § 80 Abs. 5 S. 1 Alt. 2 VwGO
Tenor bei gesetzlichem Sofortvollzug: Die aufschiebende Wirkung wird {angeordnet}. // § 80 Abs. 5 S. 1 Alt. 1 VwGO
Ist der Verwaltungsakt schon vollzogen, kommt die Anordnung der {Aufhebung der Vollziehung} hinzu. // § 80 Abs. 5 S. 3 VwGO` },
      { id: "p123", titel: "Begründetheit § 123", text: `
1. {Anordnungsanspruch} // der materielle Anspruch der Hauptsache
2. {Anordnungsgrund} // Eilbedürftigkeit
3. {Glaubhaftmachung} // § 123 Abs. 3 VwGO, §§ 920 Abs. 2, 294 ZPO
4. {Keine Vorwegnahme der Hauptsache} // Ausnahme bei sonst unzumutbaren Nachteilen und hoher Erfolgswahrscheinlichkeit
Anordnung zur Sicherung eines bestehenden Zustands: {Sicherungsanordnung} // § 123 Abs. 1 S. 1 VwGO
Anordnung zur Erweiterung des Rechtskreises: {Regelungsanordnung} // § 123 Abs. 1 S. 2 VwGO` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Im Verfahren nach § 80 Abs. 5 VwGO trifft das Gericht eine {eigene Ermessensentscheidung}.
Abgewogen wird das {Aussetzungsinteresse|Suspensivinteresse} des Antragstellers gegen das {Vollzugsinteresse|öffentliche Vollzugsinteresse}.
Maßgeblich sind die Erfolgsaussichten der Hauptsache nach {summarischer Prüfung}.
Ist der Verwaltungsakt offensichtlich rechtswidrig, überwiegt das {Aussetzungsinteresse|Suspensivinteresse}.
Vorrang hat § 80 Abs. 5 VwGO, wenn in der Hauptsache die {Anfechtungsklage} statthaft ist. // § 123 Abs. 5 VwGO
Beschwerdefrist: {zwei Wochen} // § 147 Abs. 1 S. 1 VwGO
Begründungsfrist der Beschwerde: {ein Monat} // § 146 Abs. 4 S. 1 VwGO` },
    ],
  },
  {
    id: "o-behoerde", gebiet: "oeff", titel: "Behördenklausur", unter: "Ausgangsbescheid oder Widerspruchsbescheid mit Gutachten",
    uebungen: [
      { id: "gutachten", titel: "Gutachten Ausgangsbescheid", text: `
A. {Gutachten}
  I. {Ermächtigungsgrundlage}
  II. {Formelle Rechtmäßigkeit}
    1. {Zuständigkeit}
    2. {Verfahren} // vor allem Anhörung, § 28 VwVfG
    3. {Form} // §§ 37, 39 VwVfG
  III. {Materielle Rechtmäßigkeit}
    1. {Tatbestand}
    2. {Richtiger Adressat}
    3. {Rechtsfolge} // Ermessen (§ 40 VwVfG) und Verhältnismäßigkeit
  IV. {Nebenentscheidungen}
    1. {Anordnung der sofortigen Vollziehung} // § 80 Abs. 2 S. 1 Nr. 4, Abs. 3 VwGO
    2. {Zwangsmittelandrohung}
    3. {Kosten|Gebühren}
  V. {Zweckmäßigkeit}
B. {Bescheidentwurf}` },
      { id: "bescheid", titel: "Ausgangsbescheid", text: `
{Briefkopf der Behörde} // Behörde, Geschäftszeichen, Datum
{Zustellungsvermerk} // etwa „Mit Postzustellungsurkunde“
{Anschrift des Adressaten} // bei Bevollmächtigtem an diesen, § 14 Abs. 3 VwVfG
{Betreff}
{Anrede}
{Tenor|Verfügungssatz}
  1. {Hauptregelung|Sachentscheidung}
  2. {Anordnung der sofortigen Vollziehung}
  3. {Zwangsmittelandrohung}
  4. {Kostenentscheidung|Gebührenentscheidung}
{Begründung} // § 39 Abs. 1 VwVfG
  I. {Sachverhalt}
  II. {Rechtliche Würdigung} // Ergebnis zuerst, dann Ermächtigungsgrundlage, formelle und materielle Rechtmäßigkeit, Ermessen
  {Begründung der sofortigen Vollziehung} // eigener Abschnitt, § 80 Abs. 3 S. 1 VwGO
  {Begründung der Zwangsmittelandrohung}
  {Begründung der Kostenentscheidung}
{Rechtsbehelfsbelehrung} // § 37 Abs. 6 VwVfG, § 58 Abs. 1 VwGO: Widerspruch binnen eines Monats
{Grußformel und Unterschrift}` },
      { id: "widerspruch", titel: "Widerspruchsbescheid", text: `
Gutachten
A. {Zulässigkeit des Widerspruchs}
  1. {Verwaltungsrechtsweg} // § 40 Abs. 1 S. 1 VwGO analog
  2. {Statthaftigkeit} // § 68 VwGO
  3. {Widerspruchsbefugnis} // § 42 Abs. 2 VwGO analog
  4. {Form und Frist} // § 70 Abs. 1 VwGO: ein Monat nach Bekanntgabe
  5. {Zuständige Widerspruchsbehörde} // § 73 Abs. 1 S. 2 VwGO
B. {Begründetheit des Widerspruchs}
C. {Nebenentscheidungen} // Kosten: § 73 Abs. 3 S. 3 VwGO, § 80 VwVfG
Bescheid
{Briefkopf und Zustellungsvermerk} // Zustellung zwingend, § 73 Abs. 3 S. 1, 2 VwGO
{Überschrift „Widerspruchsbescheid“}
{Tenor}
  1. Der Widerspruch wird {zurückgewiesen}.
  2. Der Widerspruchsführer trägt die {Kosten des Widerspruchsverfahrens}.
{Begründung}
  I. {Sachverhalt}
  II. {Rechtliche Würdigung} // „Der Widerspruch ist zulässig, aber unbegründet.“
{Rechtsbehelfsbelehrung} // Klage beim Verwaltungsgericht binnen eines Monats nach Zustellung, § 74 Abs. 1 S. 1 VwGO
{Unterschrift}` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Die Widerspruchsbehörde prüft {Rechtmäßigkeit und Zweckmäßigkeit} des Verwaltungsakts. // § 68 Abs. 1 S. 1 VwGO
Maßgeblich ist die Sach- und Rechtslage im Zeitpunkt der {Widerspruchsentscheidung}.
Eine Verschlechterung im Widerspruchsverfahren heißt {reformatio in peius|Verböserung}.
Die sofortige Vollziehung verlangt ein {besonderes öffentliches Interesse}, das über das Interesse am Erlass des Verwaltungsakts hinausgeht. // § 80 Abs. 2 S. 1 Nr. 4 VwGO
Dieses Interesse ist {schriftlich zu begründen}. // § 80 Abs. 3 S. 1 VwGO
Ermessen wird entsprechend dem {Zweck der Ermächtigung} und in den gesetzlichen Grenzen ausgeübt. // § 40 VwVfG
Prüfung der Verhältnismäßigkeit: legitimer Zweck, {Geeignetheit}, {Erforderlichkeit}, {Angemessenheit}
Fehlt die Rechtsbehelfsbelehrung oder ist sie unrichtig, gilt die Frist von {einem Jahr|ein Jahr}. // § 58 Abs. 2 VwGO
Eine unterbliebene Anhörung kann bis zum Abschluss der letzten Tatsacheninstanz {nachgeholt} werden. // § 45 Abs. 1 Nr. 3, Abs. 2 VwVfG` },
    ],
  },
  {
    id: "o-anwalt", gebiet: "oeff", titel: "Anwaltsklausur", unter: "Widerspruch, Klage, Eilantrag",
    uebungen: [
      { id: "aufbau", titel: "Aufbau", text: `
A. {Mandantenbegehren}
B. {Gutachten}
  I. {Statthafter Rechtsbehelf} // Widerspruch, Klage, Eilantrag nach § 80 Abs. 5 oder § 123 VwGO
  II. {Zulässigkeit}
  III. {Begründetheit}
    1. {Ermächtigungsgrundlage|Anspruchsgrundlage}
    2. {Formelle Rechtmäßigkeit}
    3. {Materielle Rechtmäßigkeit}
C. {Zweckmäßigkeit} // Fristen, zusätzlicher Eilantrag, Akteneinsicht, Kostenrisiko, Antragsfassung
D. {Praktischer Teil} // Schriftsatz an Behörde oder Gericht, Mandantenschreiben` },
      { id: "klage", titel: "Klageschrift", fall: FALL_OEFF, text: `
An das {Verwaltungsgericht Berlin}
{Klage}
des Herrn Karl Vogt, [Anschrift],
{Klägers},
{Prozessbevollmächtigte}: Rechtsanwältin Lenz,
gegen
{das Land Berlin}, vertreten durch das Bezirksamt Mitte von Berlin, [Anschrift],
{Beklagten},
wegen: {Gewerbeuntersagung}
Namens und in Vollmacht des Klägers erhebe ich Klage und {beantrage},
den Bescheid des Bezirksamts Mitte von Berlin vom 12. Januar 2026 {in der Gestalt des Widerspruchsbescheides} vom 20. März 2026 {aufzuheben},
die Zuziehung der Bevollmächtigten im Vorverfahren für {notwendig} zu erklären. // § 162 Abs. 2 S. 2 VwGO
{Begründung}
I. {Sachverhalt}
II. {Rechtliche Würdigung}` },
      { id: "eil", titel: "Eilantrag", fall: FALL_OEFF + " Die Rechtsanwältin soll vorläufigen Rechtsschutz beantragen, solange über den Widerspruch noch nicht entschieden ist.", text: `
An das Verwaltungsgericht Berlin
{Antrag auf Gewährung vorläufigen Rechtsschutzes|Antrag nach § 80 Abs. 5 VwGO}
des Herrn Karl Vogt, [Anschrift],
{Antragstellers},
gegen
das Land Berlin, vertreten durch das Bezirksamt Mitte von Berlin,
{Antragsgegner},
Namens und in Vollmacht des Antragstellers beantrage ich,
die {aufschiebende Wirkung} des Widerspruchs vom … gegen den Bescheid vom 12. Januar 2026 {wiederherzustellen}. // behördlich angeordneter Sofortvollzug, § 80 Abs. 5 S. 1 Alt. 2 VwGO
Bei gesetzlichem Sofortvollzug lautet der Antrag: die aufschiebende Wirkung {anzuordnen}. // § 80 Abs. 5 S. 1 Alt. 1 VwGO
Der Antrag ist schon vor Erhebung der {Anfechtungsklage} zulässig. // § 80 Abs. 5 S. 2 VwGO
Tatsachen sind {glaubhaft zu machen}, etwa durch eidesstattliche Versicherung.` },
      { id: "massstab", titel: "Prüfungsmaßstab", text: `
Widerspruchsfrist: {ein Monat} nach Bekanntgabe // § 70 Abs. 1 S. 1 VwGO
Klagefrist: {ein Monat} nach Zustellung des Widerspruchsbescheides // § 74 Abs. 1 S. 1 VwGO
Bei fehlender oder unrichtiger Belehrung: {ein Jahr} // § 58 Abs. 2 VwGO
Widerspruch und Anfechtungsklage haben {aufschiebende Wirkung}. // § 80 Abs. 1 S. 1 VwGO
Klagebefugnis: Geltendmachung einer {Verletzung in eigenen Rechten} // § 42 Abs. 2 VwGO
Richtiger Beklagter in Berlin: {das Land Berlin} // § 78 Abs. 1 Nr. 1 VwGO
Untätigkeitsklage frühestens nach {drei Monaten} // § 75 S. 2 VwGO
Wiedereinsetzung: Antrag binnen {zwei Wochen} nach Wegfall des Hindernisses // § 60 Abs. 2 S. 1 VwGO` },
    ],
  },
];
