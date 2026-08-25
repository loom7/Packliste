# Mitarbeiten

Kleines Projekt, zwei Leute — entsprechend schlank gehalten.

## Ablauf

1. Branch von `main` abzweigen: `git checkout -b eintraege-camping`
2. Ändern, `node test/smoke.mjs` laufen lassen
3. Pull Request aufmachen, der andere schaut kurz drüber, dann Merge

Direkt auf `main` pushen ist okay bei Tippfehlern und Ergänzungen in der Liste.
Alles, was `storage.js` oder `app.js` berührt, geht über einen Pull Request.

## Stil

- Deutsch in Oberfläche, Kommentaren und Commit-Nachrichten
- Zwei Leerzeichen Einrückung, keine Tabs
- Keine Abhängigkeiten hinzufügen (Begründung in CLAUDE.md)
- Kommentare erklären das Warum, nicht das Was

## Einträge in der Liste ergänzen

In `js/data.js` im passenden Block. Format:

```js
["Bezeichnung"]                          // ohne Zusatz
["Bezeichnung", "Kurze Erläuterung"]     // mit grauer Zeile darunter
```

Neue Einträge **ans Ende des Blocks** anhängen. Einfügen in der Mitte oder
Umsortieren verschiebt gespeicherte Haken bestehender Nutzer — warum, steht in
CLAUDE.md.

## Neuen Block anlegen

```js
{id:"kurz", t:"Überschrift", modul:"kurz", items:[ ... ]}
```

`modul` weglassen, wenn der Block immer sichtbar sein soll. Bei einem neuen
Modul zusätzlich einen Eintrag in `MODULE` ergänzen. `id` muss eindeutig sein
und darf sich später nicht mehr ändern — sie steckt in den gespeicherten Ständen.

**Das Muster `k` gefolgt von Ziffern ist belegt.** Blöcke, die Nutzer selbst
anlegen, bekommen Kennungen wie `k1`, `k2`, `k3`. Eine `id` in `data.js`, die
diesem Muster folgt, würde mit dem eigenen Block eines Nutzers kollidieren:
Beide Blöcke teilten sich dieselben Einträge, und beim Löschen des eigenen
verschwänden auch die aus `data.js`. Ein Wort als `id` wählen, wie überall
sonst — `dok`, `kleid`, `tech`.

## Vor dem Merge

- [ ] `node test/smoke.mjs` läuft durch
- [ ] Auf einem Handy angeschaut (Blöcke, Haken, Neuladen)
- [ ] Bei geänderten ausgelieferten Dateien: `CACHE` in `sw.js` hochgezählt
