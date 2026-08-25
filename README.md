# Packliste

Interaktive Urlaubs-Packliste zum Abhaken. Läuft im Browser, ohne Konto, ohne
Server, ohne Abhängigkeiten. Auf dem Handy als App auf dem Startbildschirm
installierbar und danach offline nutzbar.

## Funktionen

- Acht Basisblöcke von Dokumenten bis zu den Erledigungen vor der Abreise
- Zwölf zuschaltbare Reisearten (Flug, Auto, Strand, Berge, Ski, Camping,
  Fernreise, Städtereise, Kinder, Baby, Geschäftlich, Haustier), die passende
  Blöcke ein- und ausblenden
- Eigene Einträge je Block
- Filter „Nur Offenes zeigen", Blöcke einklappbar
- Der Stand übersteht das Neuladen und wird in mehrere Ablagen parallel
  geschrieben (siehe unten)
- Offline lauffähig über einen Service Worker

## Lokal ausprobieren

Ein Webserver ist nötig — als lokal geöffnete Datei funktionieren weder Service
Worker noch Cookies:

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

## Veröffentlichen

**GitHub Pages:** Ist über `.github/workflows/deploy-pages.yml` vorbereitet.
Einmalig unter *Settings → Pages → Source* auf „GitHub Actions" stellen, danach
veröffentlicht jeder Push auf `main` automatisch.

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
js/storage.js            Kodierung des Stands und die Ablagen
js/app.js                Aufbau der Oberfläche, Bedienung, Start
sw.js                    Offline-Betrieb
manifest.webmanifest     Angaben für die Installation
test/smoke.mjs           Rauchtest im simulierten Browser
```

Die Reihenfolge der Skripte ist bindend: `data.js` stellt `DATA` und `MODULE`
bereit, `storage.js` baut darauf `BASEIDS` auf, `app.js` benutzt beides.

## Wie der Stand gespeichert wird

Der komplette Stand wird zu einer kurzen Zeichenkette verdichtet (rund 110
Zeichen für alle Einträge) und in vier Ablagen parallel geschrieben. Beim Laden
gewinnt die mit dem jüngsten Zeitstempel:

| Ablage | Funktioniert |
|---|---|
| `localStorage` | über http/https, zuverlässigste Ablage |
| Cookie | über http/https, ein Jahr Laufzeit |
| Adresszeile (`#p=…`) | überall, auch bei lokal geöffneter Datei |
| `window.storage` | nur in Umgebungen, die das bereitstellen |

Details und die Fallstricke stehen in [CLAUDE.md](CLAUDE.md).

## Testen

```bash
npm install jsdom
node test/smoke.mjs
```

Der Test startet die Seite in einem simulierten Browser, klickt Einträge an,
lädt neu und prüft, ob der Stand vollständig zurückkommt.

## Mitarbeiten

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

MIT, siehe [LICENSE](LICENSE).
