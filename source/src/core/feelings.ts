/** Gefühle nach vier Farbfeldern (Energie und Angenehmheit), ins Deutsche übertragen. */
export type FeelingColor = "gelb" | "gruen" | "blau" | "rot";
export interface Feeling { id: string; name: string; desc: string; color: FeelingColor }

export const FEELING_COLORS: { id: FeelingColor; name: string; hex: string; glow: string }[] = [
  { id: "gelb", name: "Gelb", hex: "#d6a63e", glow: "#ffcf5a" },
  { id: "gruen", name: "Grün", hex: "#4f9a6e", glow: "#6fe0a0" },
  { id: "blau", name: "Blau", hex: "#5677c4", glow: "#86a8ff" },
  { id: "rot", name: "Rot", hex: "#b8303f", glow: "#ff3048" },
];

const GELB = `absorbed|Vertieft|Ganz konzentriert und interessiert
accomplished|Erfolgreich|Sich wirksam und erfolgreich fühlen
adoring|Verehrend|Tiefe Liebe oder Achtung für etwas oder jemanden empfinden
alert|Wach|Sich munter und konzentriert fühlen
alive|Lebendig|Voller Energie und Lebenskraft
amazed|Staunend|Ganz versunken im Staunen über ein bestimmtes Ereignis
amused|Amüsiert|Etwas lustig oder unterhaltsam finden
attentive|Aufmerksam|Ganz bei dem, was du gerade tust
awe|Ehrfürchtig|Das Gefühl, in der Gegenwart von etwas Gewaltigem zu sein
buoyant|Beschwingt|Fröhlich und lebhaft
challenged|Herausgefordert|Angespornt, ein höheres Ziel zu erreichen
chatty|Gesprächig|Lust, dich locker und freundlich zu unterhalten
cheerful|Heiter|Voller fröhlicher Gefühle
competent|Kompetent|Sich fähig fühlen, etwas erfolgreich zu tun
confident|Selbstsicher|Sich seiner selbst sicher sein
curious|Neugierig|Interessiert daran, etwas zu lernen
delighted|Entzückt|Von Freude beflügelt
desire|Verlangen|Wunsch oder Sehnsucht nach etwas oder jemandem
determined|Entschlossen|Wissen, was du willst, und dich von nichts aufhalten lassen
eager|Begierig|Ungeduldig etwas tun oder bekommen wollen
ecstatic|Ekstatisch|Das größtmögliche Maß an Freude oder Glück empfinden
elated|Hochgestimmt|Sehr freudig, stolz oder begeistert
empowered|Gestärkt|Stärker oder selbstbewusster durch jemanden oder etwas, das geschehen ist
enchanted|Verzaubert|Erfüllt von Entzücken
encouraged|Ermutigt|Unterstützt und hoffnungsvoll, mit wachsender Zuversicht
energized|Energiegeladen|Hellwach und bereit, aufzustehen und loszulegen
engaged|Engagiert|Voll aufmerksam oder ganz bei einer Sache
engrossed|Versunken|Ganz auf jemanden oder etwas konzentriert
enjoyment|Genuss|Freude an einer Tätigkeit oder einem Moment
enraptured|Hingerissen|Große Freude oder Wonne durch etwas empfinden
enthralled|Gefesselt|Begeistert und gebannt von etwas
enthusiastic|Enthusiastisch|Sehr interessiert an einer Idee oder Tätigkeit
euphoric|Euphorisch|Intensives Glück und Wohlgefühl
excited|Vorfreudig|Begeistert von etwas, das bevorsteht
exhilarated|Beflügelt|Bester Laune, heiter und belebt
fascinated|Fasziniert|Stark angezogen von etwas und interessiert daran
focused|Fokussiert|Nur mit einer Idee oder Tätigkeit beschäftigt
glad|Froh|Erfreut, zufrieden oder dankbar
glowing|Strahlend|Sehr begeistert und freudig
goofy|Albern|Sich albern und verspielt fühlen
happy|Glücklich|Sehr erfreut und voller Freude
hopeful|Hoffnungsvoll|Zuversichtlich, dass etwas Gutes geschehen wird
in-love|Verliebt|Eine starke emotionale Bindung, oft romantisch und sexuell
infatuated|Vernarrt|Starkes Interesse an jemandem oder etwas zu Beginn einer Beziehung; das Gefühl wächst zu Liebe oder vergeht mit der Zeit
inspired|Inspiriert|Von etwas so stark berührt, dass es dich zum Handeln bewegt
interested|Interessiert|Von etwas angezogen und mehr darüber erfahren wollen
joyful|Freudig|Freude empfinden und in Hochstimmung sein
motivated|Motiviert|Begeistert davon, etwas zu tun
optimistic|Optimistisch|Hoffnungsvoll und zuversichtlich mit Blick auf die Zukunft
overjoyed|Überglücklich|Hocherfreut, überaus glücklich
playful|Verspielt|Glücklich und unbeschwert
pleasant|Angenehm|Überwiegend positiv gestimmt
pleased|Erfreut|Zufrieden und glücklich über eine bestimmte Situation oder Person
productive|Produktiv|Das Gefühl, Aufgaben zu erledigen oder Ziele zu erreichen
proud|Stolz|Erfreut über eigene Leistungen oder die eines nahestehenden Menschen
reinvigorated|Neu belebt|Neue Energie spüren
romantic|Romantisch|Der Wunsch, Zuneigung und Verbundenheit zu jemandem auf besondere Weise auszudrücken
silly|Närrisch|Sich ein wenig töricht fühlen
stoked|Begeistert|Aufgeregt oder erfreut über etwas
successful|Am Ziel|Das Gefühl, etwas für dich Wichtiges erreicht zu haben
surprised|Überrascht|Überrumpelt von etwas Unerwartetem oder Ungewöhnlichem
talkative|Redselig|Der Wunsch, Gedanken und Meinungen im Gespräch zu äußern
thrilled|Aus dem Häuschen|Plötzlich sehr aufgeregt
upbeat|Schwungvoll|Voller Energie und quirlig
wishful|Hoffend|Einen Wunsch oder eine Sehnsucht hegen`;

const GRUEN = `accepted|Angenommen|Sich anerkannt und gesehen fühlen
affectionate|Zugeneigt|Zuneigung empfinden oder zeigen
appreciated|Wertgeschätzt|Sich anerkannt und würdig fühlen
at-ease|Wohlig|Zufrieden und behaglich
balanced|Ausgeglichen|Stabil und zufrieden
blessed|Gesegnet|Dankbar und glücklich über das, was du hast
blissful|Selig|Voller Freude
calm|Ruhig|Frei von Stress, Unruhe und Sorgen
carefree|Sorglos|Frei von Sorgen und unbeschwert
chill|Gechillt|Locker und entspannt
clear|Klar|Das Gefühl, Ereignisse oder Situationen, vor denen du stehst, wahrnehmen, verstehen oder deuten zu können
comfortable|Behaglich|Beruhigt an Körper und Geist
compassionate|Mitfühlend|Fürsorge und Anteilnahme für jemanden zeigen
connected|Verbunden|Sich jemandem nah oder als Teil einer Gemeinschaft fühlen
contemplative|Besinnlich|Ein nachdenklicher, reflektierter Zustand, meist über längere Zeit
content|Im Reinen|Sich vollständig fühlen und das Gefühl haben, genug zu sein
copacetic|Im Lot|Einverstanden und frei von Problemen
empathetic|Empathisch|Die Gefühle eines anderen nachvollziehen und vorübergehend teilen, ob positiv oder negativ (etwa Freude oder Kummer)
even-tempered|Gleichmütig|Ausgeglichen und in der eigenen Mitte, nicht leicht zu verärgern oder zu reizen
fulfilled|Erfüllt|Das Gefühl, wichtige persönliche Ziele erreicht zu haben oder der Mensch geworden zu sein, der du sein möchtest
good|Gut|Positiv gestimmt, alles ist in Ordnung
grateful|Dankbar|Wertschätzung für etwas oder jemanden
grounded|Geerdet|Psychisch und emotional stabil, mit realistischem Blick auf den Moment
heard|Gehört|Das Gefühl, dass dir zugehört wird
imperturbable|Unerschütterlich|Dich selbst und die Situation im Griff haben, gefasst und gelassen
included|Dazugehörig|Das Gefühl, Teil einer Gruppe zu sein
loved|Geliebt|Das Gefühl, dass jemand sich sehr um dich sorgt
loving|Liebevoll|Liebe für jemanden empfinden
mellow|Gelassen|Entspannt und locker; unkompliziert
moved|Bewegt|Ein plötzliches Gefühl, nachdem du etwas Inspirierendes oder Trauriges gesehen hast
ok|Okay|Ein zurückhaltendes Wohlgefühl, zufriedenstellend, aber weder außergewöhnlich noch intensiv
peaceful|Friedlich|Still und ruhig; ungestört
pensive|Nachdenklich|In Betrachtungen oder tiefe, ernste Gedanken versunken
poised|Gefasst|Beherrscht und selbstsicher
present|Präsent|Ganz im Moment und frei von innerem Lärm
protective|Beschützend|Das Bedürfnis, jemanden oder etwas vor Schaden zu bewahren
refreshed|Erfrischt|Erneuert und ausgeruht, mit wiederhergestellter Kraft
rejuvenated|Verjüngt|Wiederbelebt, mit voll zurückgekehrter Kraft und Energie
relaxed|Entspannt|Locker und erholt an Körper und Geist
relieved|Erleichtert|Ruhe, nachdem ein unangenehmes Gefühl verschwunden ist
respected|Respektiert|Das Gefühl, dass andere viel von dir halten
reverent|Andächtig|Feierliche Ehrfurcht spiritueller Art
safe|Sicher|Vor Gefahr geschützt
satisfied|Zufrieden|Zufrieden mit dem, was du hast oder getan hast
secure|Geborgen|Sicher und beschützt
sensual|Sinnlich|Offen für Berührung und Sinneserfahrungen, die körperliches Wohlgefühl schenken
serene|Seelenruhig|Ruhig und friedlich; unbekümmert
stable|Stabil|Das Gefühl, die Kontrolle zu haben und nicht leicht aus der Fassung zu geraten
supported|Unterstützt|Das Gefühl, dass jemand für dich da ist
sympathetic|Anteilnehmend|Mitleid oder Kummer für jemand anderen empfinden
tenderness|Zärtlichkeit|Sanftheit und Güte gegenüber jemandem
thankful|Dankerfüllt|Erfreut oder voller Wertschätzung
thoughtful|Bedacht|Rücksichtsvoll oder besonnen gegenüber einer Situation (vergangen, gegenwärtig oder künftig), dir selbst oder anderen
touched|Gerührt|Emotional berührt oder bewegt
tranquil|Still|Friedlich, frei von Anspannung
unbothered|Unbekümmert|Das Gefühl, deine Emotionen auch inmitten von Schwierigkeiten steuern zu können, ohne dich von den Ereignissen um dich herum aus der Bahn werfen zu lassen
understood|Verstanden|Das Gefühl, dass jemand dich versteht
validated|Bestätigt|Das Gefühl, gesehen und angenommen zu werden
valued|Geschätzt|Das Gefühl, wichtig zu sein
whole|Ganz|Innere Fülle und Wohlbefinden
zen|Zen|Locker gesagt: ganz im Moment und ruhig`;

const BLAU = `abandoned|Verlassen|Zurückgelassen und nicht beachtet, gewollt oder umsorgt
abused|Misshandelt|Grausame oder ungerechte Behandlung erfahren
alienated|Entfremdet|Das Gefühl, anderen fremd geworden zu sein, als hätten sie keine Gefühle oder Zuneigung für dich
apathetic|Apathisch|Ohne Begeisterung oder Interesse
ashamed|Beschämt|Ein geringeres Selbstwertgefühl wegen dem, wer du bist oder was du getan hast
avoidant|Vermeidend|Nicht bereit, dich jemandem oder etwas zu stellen oder darauf einzulassen
bereft|Beraubt|Den Verlust eines Menschen oder einer Sache erleiden
betrayed|Verraten|Verletzt, weil jemand dein Vertrauen gebrochen hat
bleh|Bäh|Gleichgültigkeit oder leichtes Unbehagen
blue|Bedrückt|Traurig, trübsinnig oder entmutigt
bored|Gelangweilt|Ohne Interesse an etwas oder jemandem
brooding|Grübelnd|Mit bedrückenden oder schmerzhaften Gedanken beschäftigt
burdened|Belastet|Beschwert von etwas oder jemandem und dafür verantwortlich
burned-out|Ausgebrannt|Erschöpft von anhaltendem Stress
cancelled|Gecancelt|Ausgestoßen wegen eines vermeintlichen Fehltritts
crushed|Am Boden zerstört|Überwältigend enttäuscht oder im Stich gelassen
dead-inside|Innerlich tot|So niedergeschlagen, dass es sich anfühlt, als hättest du deinen Lebensgeist oder deine Seele verloren
defeated|Besiegt|Entmutigt oder von Widrigkeiten überwältigt
deficient|Unzulänglich|Das Gefühl, nicht zu genügen oder eine gewünschte Eigenschaft nicht zu besitzen
dejected|Niedergeschlagen|Unglücklich, in gedrückter Stimmung
depressed|Deprimiert|Äußerst unglücklich und mutlos
desolate|Trostlos|Öde und elend
despair|Verzweiflung|Völlige Hoffnungslosigkeit
disappointed|Enttäuscht|Traurig, weil deine Erwartungen nicht erfüllt wurden
disconnected|Abgekoppelt|Getrennt von anderen
discontented|Unzufrieden|Unzufrieden mit deinen Umständen
discouraged|Entmutigt|Ein Verlust an Zuversicht und Begeisterung
disenchanted|Ernüchtert|Enttäuscht von jemandem oder etwas, das du einst bewundert hast
disengaged|Unbeteiligt|Das Gefühl, dich nicht konzentrieren zu können; desinteressiert
disgraced|Entehrt|Unter dem Verlust deines guten Rufs leiden
disgruntled|Verstimmt|Verärgert und enttäuscht
disgusted|Angewidert|Starke Abneigung gegen jemanden oder etwas
disheartened|Mutlos|Verlust an Entschlossenheit oder Willenskraft
disillusioned|Desillusioniert|Enttäuscht von jemandem, der deinem Glauben an ihn nicht gerecht geworden ist
dispirited|Verzagt|Begeisterung und Hoffnung verloren
disrespected|Missachtet|Nicht so behandelt, als zählten deine Ideen und Gefühle
dissatisfied|Missvergnügt|Unglücklich mit jemandem oder etwas
down|Down|Traurig und mit wenig Energie
empty|Leer|Ohne Sinn oder Verbindung
excluded|Ausgeschlossen|Außen vor gelassen und in einer gewünschten Gruppe unerwünscht
exhausted|Erschöpft|Völlig ohne Energie
fatigued|Ermattet|Körperlich ausgelaugt
forlorn|Trübselig|Traurig und allein zugleich
fragile|Zerbrechlich|Zart, als könntest du leicht zerbrechen
gaslit|Manipuliert|So manipuliert, dass du an deiner Wahrnehmung der Wirklichkeit zweifelst
ghosted|Geghostet|Ohne Erklärung von jeder Kommunikation abgeschnitten
glum|Missmutig|Unzufrieden; pessimistisch mit Blick auf künftige Ereignisse
grief|Trauer|Schmerz beim Verlust eines Menschen oder einer wichtigen Sache
groggy|Benommen|Schläfrig, matt, verwirrt und langsam in der Reaktion
guilty|Schuldig|Dich für ein bestimmtes Fehlverhalten verantwortlich fühlen
heartbroken|Gebrochenes Herz|Überwältigender Schmerz, meist beim Verlust einer Beziehung
helpless|Hilflos|Das Gefühl, nichts tun zu können
hesitant|Zögerlich|Unsicher oder langsam im Denken, Handeln oder Sprechen
hollow|Hohl|Das Gefühl, dass etwas fehlt
homesick|Heimweh|Sehnsucht nach dem Vertrauten des Zuhauses, wenn du fort bist
hopeless|Hoffnungslos|Völlig geschlagen und verzweifelt mit Blick auf die Zukunft
humiliated|Gedemütigt|Vor anderen bloßgestellt und lächerlich gemacht
hurting|Verletzt|Körperlichen oder seelischen Schmerz erleben
icky|Eklig|Das Gefühl, dass etwas widerlich oder abstoßend ist
inadequate|Ungenügend|Das Gefühl, dass du, so wie du bist, nicht ausreichst
incompetent|Inkompetent|Das Gefühl, nicht das Nötige für eine Aufgabe mitzubringen
indifferent|Gleichgültig|Ohne Anteilnahme oder Interesse
insecure|Unsicher|Ungewiss und ohne Vertrauen in dich selbst
invalidated|Abgewertet|Das Gefühl, dass du oder deine Meinung einfach weggewischt wurden
isolated|Isoliert|Das Gefühl, von anderen abgeschnitten zu sein
jilted|Sitzengelassen|Tief zurückgewiesen, nachdem dich ein Partner plötzlich verlassen hat
lazy|Träge|Ohne Antrieb, Energie aufzuwenden und zu handeln
letdown|Im Stich gelassen|Wenn jemand oder etwas, auf das du gezählt hast, nicht eintritt
lonely|Einsam|Traurig, weil du allein oder abgeschnitten bist
longing|Sehnsucht|Starkes, anhaltendes Verlangen, besonders nach etwas Fernem oder Unerreichbarem
lost|Verloren|Unangenehm allein und ohne Richtung
lovesick|Liebeskrank|Von jemandem träumen, den du liebst, oder ihn vermissen
malaised|Unwohl|Unruhig und verunsichert, ohne echten Grund
meh|Meh|Uninspiriert oder lustlos
melancholic|Melancholisch|Schon eine Weile leicht traurig
minimized|Kleingemacht|Durch Worte oder Taten anderer herabgesetzt oder weniger wert
miserable|Elend|Sich absolut schrecklich fühlen
morose|Verdrießlich|Traurig und trübsinnig
neglected|Vernachlässigt|Nicht genug Fürsorge oder Aufmerksamkeit bekommen
nostalgic|Nostalgisch|Wehmütige Sehnsucht nach dem Glück eines früheren Ortes, einer früheren Zeit oder Situation
numb|Taub|Gedämpftes oder fehlendes Empfinden für Gefühle, mit einem Hauch negativer Stimmung
painful|Schmerzerfüllt|Leid oder Kränkung erfahren
pathetic|Erbärmlich|Sich jämmerlich unzulänglich fühlen
pessimistic|Pessimistisch|Eine negative Sicht, die das Schlimmste erwartet
poopy|Mies|Locker gesagt: unangenehm oder unwohl
regretful|Reumütig|Dich schlecht fühlen, weil du etwas getan hast, das du lieber gelassen hättest
rejected|Zurückgewiesen|Nicht gewollt oder angenommen
remorseful|Zerknirscht|Bedauern über etwas Falsches, das du getan hast
resentful|Verbittert|Bitter oder wütend über etwas, das du für ungerecht hältst
resigned|Resigniert|Etwas Unangenehmes hinnehmen, über das du keine Kontrolle hast
sad|Traurig|Unglücklich über etwas
solemn|Ernst|Ernsthaft, mit einem Hauch Traurigkeit
sorrowful|Kummervoll|Voll tiefer Traurigkeit
spent|Ausgelaugt|Körperlich und geistig völlig erschöpft
stuck|Festgefahren|Gefangen, blockiert oder unfähig, in einer Situation oder Beziehung voranzukommen
suffocated|Erdrückt|Gefangen oder unterdrückt, als bekämst du keine Luft
sullen|Mürrisch|Schlechte Laune stumm zeigen
tired|Müde|Das Gefühl, Ruhe zu brauchen
trapped|Gefangen|Das Gefühl, dass es keinen Ausweg gibt
turned-off|Abgetörnt|Das Interesse an jemandem verlieren, weil er etwas Inakzeptables getan hat
unappreciated|Ungewürdigt|Nicht den Dank oder die Anerkennung bekommen, die du verdient zu haben glaubst
uncomfortable|Unbehaglich|Unbehagen durch Ungewissheit
undervalued|Unterschätzt|Das Gefühl, nicht genug geschätzt zu werden
unhappy|Unglücklich|Allgemeines Unbehagen oder Missfallen gegenüber jemandem oder etwas, oft verbunden mit Enttäuschung oder Traurigkeit
unmotivated|Unmotiviert|Ohne Antrieb oder Begeisterung für etwas, besonders für Arbeit oder Lernen
unseen|Übersehen|Von anderen nicht bemerkt oder für sie unsichtbar
vulnerable|Verletzlich|Das Gefühl, leicht emotional oder seelisch verletzt werden zu können
weary|Zermürbt|Müde, ohne Elan und Kraft weiterzumachen
welp|Tja|Locker gesagt: enttäuscht und resigniert akzeptierend
wistful|Wehmütig|Verlangen mit einem Anflug von Traurigkeit
worthless|Wertlos|Das Gefühl, keinen echten Wert zu haben und nichts zu verdienen`;

const ROT = `afraid|Verängstigt|Furcht oder Bedrohung erleben
agitated|Aufgewühlt|Sehr beunruhigt und rastlos
alarmed|Alarmiert|Akute Furcht oder Sorge
ambivalent|Ambivalent|Widersprüchliche Haltungen oder Gefühle zu etwas
angry|Wütend|Stark verärgert über eine wahrgenommene Ungerechtigkeit
anguished|Gequält|Schweres körperliches Leid oder Qualen erleben
annoyed|Genervt|Gestört von etwas Missfälligem oder Unangenehmem
anxious|Ängstlich|Besorgt und unruhig wegen eines ungewissen Ausgangs
apprehensive|Beklommen|Unbehagen und Sorge wegen etwas, das passieren könnte
astonished|Erstaunt|Sehr überrascht oder beeindruckt
concerned|In Sorge|Sich fragen, ob mit jemandem oder etwas alles in Ordnung ist
conflicted|Zwiegespalten|Einander widersprechende Gefühle zu etwas haben
confused|Verwirrt|Unfähig, etwas zu begreifen
contempt|Verachtung|Eine Mischung aus Wut und Abscheu
dazed|Benebelt|Das Gefühl, weder denken noch reagieren zu können
discombobulated|Durcheinander|In einen Zustand von Verwirrung oder Ungewissheit geworfen
discomfort|Unbehagen|Ein Gefühl von Unruhe oder Schmerz
displeased|Missbilligend|Unglücklich, unzufrieden oder ablehnend
distracted|Abgelenkt|Gedanklich abgeschweift oder weit weg vom eigentlichen Fokus
distressed|Aufgelöst|Körperlich unwohl und aufgewühlt, mit unterschiedlichen Ursachen (seelischer Schmerz, Bedrohung, Verlust usw.)
dread|Grauen|Angst, weil du etwas Unangenehmes oder Belastendes erwartest
dumbfounded|Sprachlos|Vor Schreck sprachlos
dysregulated|Dysreguliert|Das Gefühl, deine Emotionen nicht stabilisieren zu können
embarrassed|Verlegen|Befangen und unwohl bei dem Gedanken, wie andere dich wahrnehmen
enraged|Außer sich|Von etwas in Rage versetzt; voll äußerster Wut
envious|Neidisch|Verlangen nach etwas, das jemand anderes hat
exasperated|Entnervt|Heftige Gereiztheit erleben
flabbergasted|Verdattert|Heftige Überraschung oder Bestürzung
fomo|FOMO|Angst, etwas zu verpassen
foolish|Töricht|Befangen, nachdem du etwas Unkluges getan hast
frazzled|Abgekämpft|Erschöpft, durcheinander und emotional aufgerieben
frightened|Verschreckt|Verängstigt oder furchtsam
frozen|Erstarrt|Das Gefühl, vor überwältigender Angst oder Furcht nicht handeln zu können
frustrated|Frustriert|Aufgebracht, weil du etwas nicht tun kannst, das du tun willst
furious|Rasend|Voll äußerster oder wilder Wut
grumpy|Grantig|Schlecht gelaunt und leicht reizbar
hate|Hass|Heftige Abneigung gegen etwas oder jemanden
horrified|Entsetzt|Heftige Furcht oder Abscheu erleben
hyper|Aufgedreht|Voller Energie, mit dem Drang, dich zu bewegen
impassioned|Glühend|Erfüllt von starken Gefühlen
indecisive|Unentschlossen|Unfähig, dich wegen widerstreitender Gefühle zu entscheiden
indignant|Empört|Wütend und angewidert, weil du ungerecht behandelt wirst
irate|Zornig|Das Gefühl, dass deine Wut fast außer Kontrolle gerät
irked|Verärgert|Argwöhnisch und ungeduldig
irritable|Reizbar|Leicht zu stören oder zu verärgern
irritated|Gereizt|Leicht wütend oder genervt von einer Handlung oder einem Ereignis
jealous|Eifersüchtig|Bedroht, weil du fürchtest, eine wichtige Beziehung an jemand anderen zu verlieren
jittery|Zappelig|Angespannt und schreckhaft
livid|Fuchsteufelswild|Wütend über etwas oder jemanden
mad|Sauer|Sehr wütend
nauseated|Angeekelt|Übel vor Ekel
nervous|Nervös|Unruhig und besorgt wegen der Zukunft oder eines ungewissen Ereignisses
obsessed|Besessen|Von einer Idee oder einem Interesse eingenommen oder verfolgt
overwhelmed|Überwältigt|Das Gefühl, von starken Gefühlen überrollt zu werden
panicked|In Panik|Hektisch und von Angst überwältigt
passionate|Leidenschaftlich|Starkes Engagement und Hingabe für jemanden oder etwas
peeved|Verschnupft|Leicht gereizt wegen etwas
pissed|Stinksauer|Sehr wütend oder genervt
pressured|Unter Druck|Das Gefühl, dass ein wichtiges Ergebnis von dir abhängt
repulsed|Abgestoßen|Von jemandem oder etwas angeekelt
restless|Ruhelos|Unfähig, dich wegen Angst oder Langeweile zu entspannen
rushed|Gehetzt|Unter Druck, dich schnell zu bewegen oder etwas schnell zu erledigen
scared|Furchtsam|Bedrohung oder Gefahr wahrnehmen, ob von außen oder im eigenen Körper
scorn|Geringschätzung|Das Gefühl, dass jemand oder etwas wertlos oder verachtenswert ist
shocked|Schockiert|Äußerstes Entsetzen, Abscheu und Überraschung erleben
spiteful|Gehässig|Der Wunsch, jemanden zur Weißglut zu bringen, um es ihm heimzuzahlen
startled|Aufgeschreckt|Vor Überraschung oder Schreck plötzlich zusammenzucken
strained|Angestrengt|Anspannung durch äußerste Anstrengung
stressed|Gestresst|Mental oder emotional überlastet durch zu viele Anforderungen und zu wenig Kraftreserven
stunned|Fassungslos|Verwirrt oder verblüfft von einem Ereignis
taken-aback|Vor den Kopf gestoßen|Überrascht von etwas Unangenehmem oder Kränkendem
tense|Angespannt|Unfähig, dich zu entspannen
terrified|Zu Tode erschrocken|Von Angst verzehrt
triggered|Getriggert|Von etwas ausgelöst oder aktiviert
troubled|Beunruhigt|Besorgt wegen eines Problems oder Konflikts
uncertain|Ungewiss|Mangel an Klarheit oder Zuversicht in Bezug auf etwas
uneasy|Unruhig|Ein vages Gefühl, dass etwas nicht stimmt
unstable|Wackelig|Unausgeglichen und unsicher
upset|Aufgebracht|Gestört oder aufgewühlt
vengeful|Rachsüchtig|Der Wunsch, jemandem wegen einer wahrgenommenen Ungerechtigkeit zu schaden
worried|Besorgt|Beunruhigt wegen tatsächlicher oder möglicher Probleme`;

const parse = (txt: string, color: FeelingColor): Feeling[] =>
  txt.split("\n").map((l) => { const [id, name, desc] = l.split("|"); return { id, name, desc, color }; })
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

export const FEELINGS: Feeling[] = [...parse(GELB, "gelb"), ...parse(GRUEN, "gruen"), ...parse(BLAU, "blau"), ...parse(ROT, "rot")];
export const feelingById = (id: string) => FEELINGS.find((f) => f.id === id);
export const colorById = (id: FeelingColor) => FEELING_COLORS.find((c) => c.id === id)!;

/** Tagesprotokoll: Datum → Gefühle in der Reihenfolge der Auswahl */
export type FeelingLog = Record<string, string[]>;

/** Vorherrschende Farbe eines Tages: die häufigste; bei Gleichstand die zuletzt gewählte. */
export function dominantColor(ids: string[] | undefined): FeelingColor | null {
  if (!ids?.length) return null;
  const n: Record<string, number> = {};
  let best: FeelingColor | null = null, bestN = 0;
  for (const id of ids) {
    const c = feelingById(id)?.color; if (!c) continue;
    n[c] = (n[c] ?? 0) + 1;
    if (n[c] >= bestN) { bestN = n[c]; best = c; }
  }
  return best;
}
