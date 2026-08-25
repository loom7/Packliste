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
async function starten(speicher) {
  const dom = new JSDOM(readFileSync(join(ROOT, "index.html"), "utf8"), {
    url: "https://example.test/",
    runScripts: "dangerously",     // wie im Browser: gemeinsamer globaler Gueltigkeitsbereich
    pretendToBeVisual: true
  });
  const w = dom.window;
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

console.log(fehler ? `\n${fehler} Pruefung(en) fehlgeschlagen\n` : "\nAlle Pruefungen bestanden\n");
process.exit(fehler ? 1 : 0);
