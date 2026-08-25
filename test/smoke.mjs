/* Packliste — Rauchtest
   Startet die Seite in einem simulierten Browser (jsdom), klickt Eintraege an,
   laedt neu und prueft, ob der Stand vollstaendig zurueckkommt.

   Ausfuehren:  node test/smoke.mjs        (benoetigt: npm i jsdom)          */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fehler = 0;
const pruefe = (name, ok, zusatz = "") => {
  console.log((ok ? "  OK   " : "  FEHL ") + name + (zusatz ? "  — " + zusatz : ""));
  if (!ok) fehler++;
};

/* Eine Seite starten. speicher wird zwischen den Laeufen behalten,
   damit ein Neuladen realistisch nachgestellt ist.                          */
async function starten(speicher, fragment = "") {
  const dom = new JSDOM(readFileSync(join(ROOT, "index.html"), "utf8"), {
    url: "https://example.test/" + fragment,
    runScripts: "dangerously",     // wie im Browser: gemeinsamer globaler Gueltigkeitsbereich
    pretendToBeVisual: true
  });
  const w = dom.window;
  /* jsdom stellt TextEncoder/TextDecoder nicht bereit, im Browser sind sie da */
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.localStorage.clear();
  for (const [k, v] of Object.entries(speicher)) w.localStorage.setItem(k, v);
  // jsdom laedt die src-Verweise nicht nach, also selbst einhaengen — Reihenfolge zaehlt
  for (const f of ["js/data.js", "js/storage.js", "js/app.js"]) {
    const s = w.document.createElement("script");
    s.textContent = readFileSync(join(ROOT, f), "utf8");
    w.document.body.appendChild(s);
  }
  await new Promise(r => setTimeout(r, 400));   // Debounce (300 ms) abwarten
  return w;
}

const auslesen = w => {
  const o = {};
  for (const k of Object.keys(w.localStorage)) o[k] = w.localStorage.getItem(k);
  return o;
};
const zeilen = w => [...w.document.querySelectorAll("li")];
const gehakt = w => zeilen(w).filter(li => li.classList.contains("ok")).length;
const warten = () => new Promise(r => setTimeout(r, 400));   // Entprellung (300 ms)
const ueberschriften = w => [...w.document.querySelectorAll(".head h2")].map(h => h.textContent);
const beschriftungen = w => [...w.document.querySelectorAll(".txt")].map(t => t.textContent);
const abschnitt = (w, titel) =>
  [...w.document.querySelectorAll("section")].find(s => s.querySelector("h2").textContent === titel);

console.log("\nPackliste — Rauchtest\n");

/* 1. Erststart */
let w = await starten({});
pruefe("Seite baut Abschnitte auf", w.document.querySelectorAll("section").length > 0,
       w.document.querySelectorAll("section").length + " Abschnitte");
pruefe("Eintraege vorhanden", zeilen(w).length > 50, zeilen(w).length + " Zeilen");
pruefe("Fortschrittszeile gefuellt", w.document.getElementById("mrz").textContent.length > 20);
pruefe("Start ohne Haken", gehakt(w) === 0);

/* 2. Eintraege anklicken */
const ziel = zeilen(w).slice(0, 5);
ziel.forEach(li => li.querySelector(".row").click());
await new Promise(r => setTimeout(r, 400));
pruefe("Klick setzt Haken", gehakt(w) === 5, gehakt(w) + " von 5");
pruefe("Fussnote meldet Speicherung",
       /gespeichert/.test(w.document.getElementById("foot").textContent),
       w.document.getElementById("foot").textContent);

/* 3. Modul zuschalten */
const vorher = zeilen(w).length;
w.document.querySelectorAll("#chips .chip")[5].click();
await new Promise(r => setTimeout(r, 400));
pruefe("Modul blendet Block ein/aus", zeilen(w).length !== vorher,
       vorher + " -> " + zeilen(w).length);

/* 4. Eigener Eintrag */
const feld = w.document.querySelector(".add input");
feld.value = "Ersatzbrille für Grüße";
feld.parentElement.querySelector("button").click();
await new Promise(r => setTimeout(r, 400));
pruefe("Eigener Eintrag erscheint",
       [...w.document.querySelectorAll(".txt")].some(t => t.textContent.includes("Ersatzbrille für Grüße")));

const standVorher = { haken: gehakt(w), zeilen: zeilen(w).length };
const speicher = auslesen(w);
pruefe("Stand liegt im Browser-Speicher", Object.keys(speicher).length > 0,
       (speicher["packliste:v1"] || "").length + " Zeichen");

/* 5. Neuladen */
w = await starten(speicher);
pruefe("Haken ueberstehen Neuladen", gehakt(w) === standVorher.haken,
       gehakt(w) + " statt " + standVorher.haken);
pruefe("Modulauswahl uebersteht Neuladen", zeilen(w).length === standVorher.zeilen,
       zeilen(w).length + " statt " + standVorher.zeilen);
pruefe("Eigener Eintrag uebersteht Neuladen",
       [...w.document.querySelectorAll(".txt")].some(t => t.textContent.includes("Ersatzbrille für Grüße")));

/* 6. Beschaedigter Stand darf nicht ueberschreiben */
w = await starten({ "packliste:v1": "kaputt###" });
pruefe("Beschaedigter Stand wird gemeldet",
       w.document.getElementById("status").textContent === "Stand unlesbar",
       w.document.getElementById("status").textContent);
pruefe("Beschaedigter Stand wird nicht ueberschrieben",
       w.localStorage.getItem("packliste:v1") === "kaputt###");

/* 7. Eigene Kategorie anlegen und fuellen */
w = await starten({});
w.document.querySelector(".neuekat input").value = "Angeln";
w.document.querySelector(".neuekat button").click();
await warten();
pruefe("Eigene Kategorie erscheint", ueberschriften(w).includes("Angeln"),
       ueberschriften(w).length + " Abschnitte");

const angeln = abschnitt(w, "Angeln");
angeln.querySelector(".add input").value = "Angelrute";
angeln.querySelector(".add button").click();
await warten();
pruefe("Eintrag in eigener Kategorie erscheint",
       beschriftungen(w).some(t => t.includes("Angelrute")));

const katSpeicher = auslesen(w);
w = await starten(katSpeicher);
pruefe("Eigene Kategorie uebersteht Neuladen", ueberschriften(w).includes("Angeln"));
pruefe("Eintrag darin uebersteht Neuladen",
       beschriftungen(w).some(t => t.includes("Angelrute")));

/* 8. Kategorie loeschen nimmt ihre Eintraege mit */
w.confirm = () => true;
abschnitt(w, "Angeln").querySelector(".katweg").click();
await warten();
pruefe("Kategorie loeschen entfernt den Abschnitt", !ueberschriften(w).includes("Angeln"));
pruefe("Kategorie loeschen entfernt ihre Eintraege",
       !beschriftungen(w).some(t => t.includes("Angelrute")));

/* 9. Teil-Link */
w = await starten(katSpeicher);
const link = w.teilLink();
const fragment = link.slice(link.indexOf("#"));
pruefe("Teil-Link traegt den Stand", fragment.startsWith("#g="), fragment.length + " Zeichen");

/* 10. Geteilter Link ohne eigenen Stand wird uebernommen */
w = await starten({}, fragment);
pruefe("Geteilte Liste wird ohne eigenen Stand uebernommen",
       ueberschriften(w).includes("Angeln") &&
       beschriftungen(w).some(t => t.includes("Angelrute")));
pruefe("Uebernahme wird gemeldet",
       /geteilte Liste|gespeichert/.test(w.document.getElementById("status").textContent),
       w.document.getElementById("status").textContent);

/* 11. Geteilter Link neben eigenem Stand fragt nach und fuehrt zusammen */
let eigen = await starten({});
eigen.document.querySelector(".neuekat input").value = "Musik";
eigen.document.querySelector(".neuekat button").click();
await warten();
const eigenerSpeicher = auslesen(eigen);

w = await starten(eigenerSpeicher, fragment);
const dlg = w.document.querySelector(".dialog");
pruefe("Geteilter Link fragt nach, statt zu ueberschreiben", !!dlg);
if (dlg) {
  dlg.querySelector(".wahl button").click();     // erster Knopf: Zusammenfuehren
  await warten();
}
pruefe("Zusammenfuehren behaelt beide Kategorien",
       ueberschriften(w).includes("Angeln") && ueberschriften(w).includes("Musik"),
       ueberschriften(w).filter(t => t === "Angeln" || t === "Musik").join(", "));
pruefe("Zusammenfuehren behaelt den fremden Eintrag",
       beschriftungen(w).some(t => t.includes("Angelrute")));
pruefe("Dialog verschwindet nach der Wahl", !w.document.querySelector(".dialog"));

/* 12. Zusammenfuehren rechnerisch: vereinigen, aber nichts doppeln */
const eintraege = st => Object.keys(st.extra).reduce((n, c) => n + st.extra[c].length, 0);
const a = w.decode(speicher["packliste:v1"]);                     // 5 Haken, ein eigener Eintrag
const b = w.decode(w.localStorage.getItem("packliste:v1"));       // Angeln und Musik
const vereint = w.zusammenfuehren(a, b);
pruefe("Zusammenfuehren vereinigt Kategorien",
       vereint.kat.length === a.kat.length + b.kat.length,
       vereint.kat.length + " aus " + a.kat.length + " und " + b.kat.length);
pruefe("Zusammenfuehren vereinigt Haken",
       Object.keys(vereint.done).length >= Object.keys(a.done).length,
       Object.keys(vereint.done).length + " Haken");
pruefe("Zusammenfuehren vereinigt Eintraege",
       eintraege(vereint) === eintraege(a) + eintraege(b),
       eintraege(vereint) + " aus " + eintraege(a) + " und " + eintraege(b));

const doppelt = w.zusammenfuehren(a, a);   // derselbe Stand zweimal
pruefe("Zusammenfuehren doppelt keine Haken",
       Object.keys(doppelt.done).length === Object.keys(a.done).length,
       Object.keys(doppelt.done).length + " statt " + Object.keys(a.done).length);
pruefe("Zusammenfuehren doppelt keine Eintraege",
       eintraege(doppelt) === eintraege(a),
       eintraege(doppelt) + " statt " + eintraege(a));

console.log(fehler ? `\n${fehler} Pruefung(en) fehlgeschlagen\n` : "\nAlle Pruefungen bestanden\n");
process.exit(fehler ? 1 : 0);
