# Hinweise für Claude Code

Kontext für die Arbeit an diesem Projekt. Kurz halten und aktuell halten.

## Was das Projekt ist

Eine Packliste zum Abhaken als statische Seite. **Keine Abhängigkeiten, kein
Build-Schritt, kein Framework.** Diese Entscheidung ist gewollt: Die Seite soll
sich auf jeden Webspace kopieren lassen und in zehn Jahren noch laufen. Kein
npm-Paket einführen, ohne dass es dafür einen zwingenden Grund gibt. Die einzige
Entwicklungsabhängigkeit ist `jsdom` für den Test.

## Sprache

Oberfläche, Kommentare, Bezeichner und Commit-Nachrichten auf Deutsch. Umlaute
in Oberflächentexten normal ausschreiben, in Bezeichnern vermeiden.

## Ladeordnung

`index.html` lädt `js/data.js`, `js/storage.js`, `js/app.js` als klassische
Skripte am Ende von `<body>`, in genau dieser Reihenfolge. Sie teilen sich einen
globalen Gültigkeitsbereich:

- `data.js` → `DATA` (Blöcke und Einträge), `MODULE` (Reisearten)
- `storage.js` → `BASEIDS`, `S` (Zustand), `encode`/`decode`, `load`/`save`
- `app.js` → `render`, `chips`, Werkzeugleiste, Start

Keine ES-Module. Ein `type="module"` würde die Reihenfolge und den gemeinsamen
Gültigkeitsbereich brechen.

## Zustand und Kodierung

`S` hat die Form `{done, mods, extra, zu, kat, filter, ts}`. `encode()` verdichtet
das zu einer Zeichenkette aus acht durch **Punkt** getrennten Feldern:

```
1 . Zeitstempel(36) . Haken(base64url-Bitmaske) . Module(36) . Eingeklappt(36) . Filter(0|1) . Eigene(base64url) . Kategorien(base64url)
```

Feld 8 ist neu und fehlt in älteren Ständen — `decode()` behandelt es deshalb
als optional. Jeder Eintrag darin ist `[Kennung, Bezeichnung, eingeklappt,
ausgeblendet]`. Eigene Blöcke tragen beide Zustände im eigenen Datensatz, weil
Feld 4 und 5 Bitmasken über `MODULE` und `DATA` sind und sie dort nicht
vorkommen. Das vierte Element kam später dazu und darf ebenfalls fehlen — beim
Erweitern immer hinten anhängen, nie dazwischen.

**Der Punkt als Trennzeichen ist keine Geschmacksfrage.** Vorher stand dort ein
`|`, den Browser in der Adresszeile zu `%7C` umschreiben — der Stand war beim
Neuladen nicht mehr lesbar und wurde anschließend mit einer leeren Liste
überschrieben. Der Zeichensatz muss auf `A–Z a–z 0–9 . - _` beschränkt bleiben,
sonst kehrt der Fehler zurück. `decode()` versteht zur Sicherheit weiterhin
prozentkodierte Eingaben und das alte Format mit `|`.

Die Haken-Bitmaske ist **positionsabhängig**: Bit *n* gehört zum *n*-ten Eintrag
in `BASEIDS`, das sich aus der Reihenfolge in `DATA` ergibt.

## Teilen und Zusammenführen

Es gibt zwei Fragmente in der Adresszeile, und die Unterscheidung ist der ganze
Trick: `#p=` schreibt die Anwendung bei jedem Speichern selbst, `#g=` entsteht
nur über den Knopf „Liste teilen". Beim Laden landet `#p=` in der normalen
Auswahl nach jüngstem Zeitstempel, `#g=` dagegen **nie** — sonst würde ein
geteilter Link den Stand des Empfängers je nach Uhrzeit stillschweigend
überschreiben. Stattdessen fragt `geteiltesUebernehmen()` nach.

`zusammenfuehren(eigen, fremd)` vereinigt zwei Stände. Haken der Basisliste und
Module lassen sich über ihre Kennung vergleichen, **eigene Einträge und
Kategorien nicht**: Deren laufende Nummern (`k1`, `dok-x0`) entstehen auf jedem
Gerät unabhängig voneinander, `k1` hier und `k1` dort sind nicht dasselbe.
Beide werden deshalb über ihre Bezeichnung abgeglichen und bekommen im Ergebnis
neue Kennungen. Wer daran etwas ändert, muss diesen Punkt im Kopf behalten.

## Einträge ändern — Auswirkung auf gespeicherte Stände

Nur `js/data.js` anfassen. Dabei gilt:

- **Einträge am Ende eines Blocks anhängen** verschiebt nichts. Unproblematisch.
- **Einträge in der Mitte einfügen oder löschen** verschiebt alle folgenden Bits.
  Gespeicherte Stände zeigen dann verrutschte Haken.
- **Blöcke umsortieren** hat denselben Effekt.

Wenn ein solcher Eingriff nötig ist: `KEY` in `storage.js` auf `packliste:v2`
hochziehen. Alte Stände werden dann ignoriert statt falsch dargestellt.

## Service Worker

Bei jeder Änderung an ausgelieferten Dateien in `sw.js` die Konstante `CACHE`
hochzählen und neue Dateien in `DATEIEN` eintragen. Sonst sehen Nutzer mit
installierter App weiterhin die alte Fassung.

## Bekannte Grenzen der Umgebung

- **Lokal geöffnete Dateien (`file://`) funktionieren nicht.** Cookies sind dort
  laut Spezifikation leer, `history.replaceState` wird abgelehnt, und seit
  Android 10/11 dürfen Browser ohnehin kaum noch auf lokale Dateien zugreifen.
  Zum Testen immer einen Webserver benutzen.
- Service Worker brauchen https oder localhost.
- Die Schriften kommen von Google Fonts. Ohne Netz greifen beim ersten Aufruf
  die Rückfallschriften. Wer das nicht will, muss die Schriften mit ausliefern.

## Vor jedem Commit

```bash
node test/smoke.mjs
```

Der Test deckt Aufbau, Klicken, Module, eigene Einträge, Neuladen und
beschädigte Stände ab. Bei Änderungen an `storage.js` oder `app.js` ist er
Pflicht. Achtung: Das Speichern ist um 300 ms entprellt — in Tests entsprechend
warten.
