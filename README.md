# Packliste

Interaktive Urlaubs-Packliste zum Abhaken. Läuft im Browser, ohne Konto, ohne
Server, ohne Abhängigkeiten. Auf dem Handy als App auf dem Startbildschirm
installierbar und danach offline nutzbar.

**Live: <https://loom7.github.io/Packliste/>**

## Funktionen

- Acht Basisblöcke von Dokumenten über die Reiseapotheke bis zu den
  Erledigungen vor der Abreise
- Zwölf zuschaltbare Reisearten (Flug, Auto, Strand, Berge, Ski, Camping,
  Fernreise, Städtereise, Kinder, Baby, Geschäftlich, Haustier), die passende
  Blöcke ein- und ausblenden
- Eigene Einträge je Block
- **Eigene Blöcke** über den Chip „Neu" in der Chip-Zeile. Jeder eigene Block
  bekommt dort einen eigenen Chip hinter den Reisearten, der ihn genauso ein-
  und ausblendet. Entfernen geht an zwei Stellen: über die diagonal
  abgetrennte Ecke oben rechts im Block oder über den Mülleimer im Chip
- **Liste per Link weitergeben**, beim Öffnen wahlweise zusammenführen
  (siehe unten)
- Filter „Nur Offenes zeigen", Blöcke einklappbar
- Der Stand übersteht das Neuladen und wird in mehrere Ablagen parallel
  geschrieben (siehe unten)
- Offline lauffähig über einen Service Worker

## Lokal ausprobieren

Ein Webserver ist nötig — als lokal geöffnete Datei funktionieren weder Service
Worker noch Cookies:

```bash
python3 -m http.server 8000
```

Unter Windows heißt der Befehl `python -m http.server 8000`. Danach
<http://localhost:8000> öffnen.

## Veröffentlichen

**GitHub Pages:** Läuft. Jeder Push auf `main` veröffentlicht über
`.github/workflows/deploy-pages.yml` automatisch nach
<https://loom7.github.io/Packliste/>. In einer frischen Kopie des Projekts muss
dafür einmalig unter *Settings → Pages → Source* „GitHub Actions" eingestellt
werden, sonst schlägt der Workflow mit `Get Pages site failed` fehl.

**Netlify Drop:** Projektordner auf <https://app.netlify.com/drop> ziehen. Ohne
Konto möglich, Ergebnis ist eine zufällige Adresse.

## Auf dem Handy installieren

Veröffentlichte Adresse im Browser öffnen → Menü → „Zum Startbildschirm
hinzufügen". Danach startet die Liste ohne Browserleiste und funktioniert auch
ohne Netz.

## Aufbau

```
index.html               Gerüst, lädt die drei Skripte in fester Reihenfolge
css/style.css            Gestaltung
js/data.js               Inhalt der Liste — hier werden Einträge gepflegt
js/storage.js            Kodierung des Stands, Ablagen, Zusammenführen
js/app.js                Aufbau der Oberfläche, Bedienung, Start
sw.js                    Offline-Betrieb
manifest.webmanifest     Angaben für die Installation
icons/                   App-Symbole für den Startbildschirm
test/smoke.mjs           Rauchtest im simulierten Browser
.github/workflows/       Prüfungen bei jedem Pull Request, Pages-Deploy
```

Die Reihenfolge der Skripte ist bindend: `data.js` stellt `DATA` und `MODULE`
bereit, `storage.js` baut darauf `BASEIDS` auf, `app.js` benutzt beides.

## Wie der Stand gespeichert wird

Der komplette Stand wird zu einer kurzen Zeichenkette verdichtet — rund 120
Zeichen für eine gefüllte Liste, mit vielen eigenen Einträgen entsprechend mehr
— und in vier Ablagen parallel geschrieben. Beim Laden gewinnt die mit dem
jüngsten Zeitstempel:

| Ablage | Funktioniert |
|---|---|
| `localStorage` | über http/https, zuverlässigste Ablage |
| Cookie | über http/https, ein Jahr Laufzeit |
| Adresszeile (`#p=…`) | über http/https; einzige Ablage, die beim Kopieren der Adresse mitgeht |
| `window.storage` | nur in Umgebungen, die das bereitstellen |

Als lokal geöffnete Datei (`file://`) läuft die Seite nicht — Cookies sind dort
leer, `history.replaceState` wird abgelehnt. Zum Ausprobieren immer einen
Webserver benutzen, siehe oben.

In der Adresszeile gibt es zwei Fragmente, und die Unterscheidung ist wichtig:
`#p=` schreibt die Anwendung beim Speichern selbst, `#g=` entsteht nur über den
Knopf „Liste teilen". Nur `#p=` geht in die Auswahl nach jüngstem Zeitstempel
ein — sonst würde ein geteilter Link je nach Uhrzeit den Stand des Empfängers
überschreiben.

Details und die Fallstricke stehen in [CLAUDE.md](CLAUDE.md).

## Zu zweit an einer Liste arbeiten

Der Knopf **„Liste teilen"** erzeugt einen Link, der die komplette Liste
enthält — Haken, Reisearten, eigene Einträge und eigene Blöcke. Wer ihn öffnet
und selbst schon eine Liste hat, wird gefragt:

- **Zusammenführen** — beide Stände werden vereinigt. Haken und Reisearten
  addieren sich, eigene Einträge und Blöcke werden über ihre **Bezeichnung**
  abgeglichen, Doppelte fallen weg. Ein Block, den einer von beiden sichtbar
  hat, ist danach sichtbar.
- **Nur die geteilte** — der eigene Stand wird ersetzt.
- **Eigene behalten** — der Link wird verworfen.

Wer noch keine eigene Liste hat, bekommt die geteilte ohne Rückfrage.

Der Abgleich über die Bezeichnung ist Absicht: Die laufenden Nummern in den
Kennungen entstehen auf jedem Gerät unabhängig, `k1` hier und `k1` dort sind
nicht derselbe Block.

**Das ist kein Live-Abgleich.** GitHub Pages liefert nur statische Dateien aus,
es gibt keinen Server, der einen gemeinsamen Stand halten könnte. Änderungen des
einen erscheinen also nicht von selbst beim anderen; man schickt den Link hin
und zurück und führt zusammen. Für eine Reise zu zweit reicht das, für echte
Gleichzeitigkeit bräuchte es eine Gegenstelle — und damit eine Abhängigkeit, die
dieses Projekt bewusst nicht hat.

## Testen

```bash
npm install jsdom
node test/smoke.mjs
```

Der Rauchtest startet die Seite in einem simulierten Browser und bedient sie
wie ein Mensch. Über vierzig Prüfungen decken ab: Aufbau der Liste, Haken
setzen, Reisearten zuschalten, eigene Einträge, eigene Blöcke anlegen samt
Nummerierung gleicher Bezeichnungen, Chip und Löschecke, Neuladen, ein
beschädigter Stand, der Teil-Link und das Zusammenführen zweier Stände.

Dasselbe läuft über `.github/workflows/check.yml` bei jedem Pull Request, dazu
eine Syntaxprüfung aller Skripte, eine Prüfung des Manifests auf gültiges JSON
und ein Abgleich, ob die im Service Worker aufgeführten Dateien tatsächlich
existieren.

## Mitarbeiten

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

MIT, siehe [LICENSE](LICENSE).
