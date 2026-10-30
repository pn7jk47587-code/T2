# App 

Persönliche Organisations-App. Startseite mit Profilkopf, Tagesüberblick und Kacheln. Alle Daten bleiben lokal auf dem Gerät.

## Starten

```bash
npm install
npm run dev        # Entwicklung, http://localhost:5173
npm run build      # Produktions-Build nach dist/
SINGLE_FILE=1 npx vite build --outDir dist-single   # eine einzelne index.html
```

## Aufbau

```
src/
  core/
    modules.ts     Register aller Kacheln (Titel, Icon, Farben, Beiträge zum Tagesüberblick)
    sources.ts     Datenquellen (Health, Standort, Bildschirmzeit) und buildDayCard()
    types.ts       Profile, DayCard, StoredItem
    db.ts          IndexedDB-Speicher und useStored()-Hook, Fallback auf Arbeitsspeicher
    image.ts       Profilbild verkleinern
  components/      Icon, Shell (Rahmen der Unterseiten), DayCardView (Tageskarte)
  screens/
    Home.tsx       Profilkopf, Tagesüberblick, Kachelraster
    Fundorte.tsx   erstes funktionierendes Modul, Vorlage für die übrigen
    Archiv.tsx     Tageskarten, mit Beispielkarte
    Einstellungen.tsx  Profil, Darstellung, Datenquellen, Sicherung
    Stub.tsx       Platzhalter für alle noch leeren Module
    index.tsx      ordnet Modul-ID und Screen zu
  styles/          theme.css (Farben, Variablen), app.css
```

## Neues Modul ausarbeiten

1. Eintrag in `src/core/modules.ts` anpassen (`feeds` nennt die Werte, die das Modul zum Tagesüberblick beisteuert).
2. Screen in `src/screens/` anlegen, `Fundorte.tsx` als Vorlage nehmen.
3. Screen in `src/screens/index.tsx` eintragen. Ohne Eintrag zeigt die App den Platzhalter.

## Tageskarte

`DayCard` in `src/core/types.ts` beschreibt alle Felder. Jede Datenquelle in `sources.ts` liefert einen Teil davon über `collect(date)`. `buildDayCard()` fügt die Teile zusammen. Die Tageskarte wird später am Tagesende erzeugt, im Schlüssel `daycards` gespeichert und im Archiv angezeigt.

## Grenzen einer Web-App und der Weg zur nativen App

Der Browser (auch als Home-Bildschirm-App) kann auf iOS nicht auf Apple Health, Standort im Hintergrund oder Bildschirmzeit pro App zugreifen. Ebenso gibt es im Browser keine verlässlichen Benachrichtigungen zu festen Uhrzeiten. Für diese Teile braucht die App eine native iOS-Hülle:

| Bedarf | Technik |
| --- | --- |
| Schritte, Schlaf, Ernährung | HealthKit über ein Capacitor-Plugin oder ein eigenes Swift-Plugin |
| Wege, Route | Core Location mit Hintergrundstandort |
| Bildschirmzeit pro App | Screen-Time-API (FamilyControls, DeviceActivity). Das Entitlement lässt sich für Entwicklung in Xcode aktivieren, für TestFlight und App Store braucht es eine Freigabe von Apple. Die Daten werden in einer Report-Erweiterung dargestellt, der Export in die Haupt-App ist eingeschränkt. |
| Erinnerungen zu Uhrzeiten | lokale Benachrichtigungen (UNUserNotificationCenter) |

Der Plan: dieselbe Oberfläche in Capacitor einpacken, die Platzhalter in `sources.ts` durch Plugin-Aufrufe ersetzen. Oberfläche und Tageskarte bleiben unverändert. Ein Apple-Entwicklerkonto und ein Mac mit Xcode sind dafür nötig.

## Hochladen auf GitHub

```bash
git init
git add .
git commit -m "Grundgerüst"
git branch -M main
git remote add origin https://github.com/<name>/app-royal.git
git push -u origin main
```

`node_modules`, `dist` und `dist-single` stehen in `.gitignore`.
