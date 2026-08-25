/* Packliste — Aufbau der Oberflaeche, Bedienung, Start
   Aufbau des Projekts: siehe CLAUDE.md */

/* ---------------- Aufbau ---------------- */
const app = document.getElementById("app");

/* Basisbloecke aus DATA und die selbst angelegten Kategorien in einer Liste.
   Eigene Kategorien haben keine festen Eintraege — alles darin ist "extra". */
function kategorien(){
  return DATA.concat(S.kat.map(k => ({id:k.id, t:k.t, items:[], eigen:true, aus:k.aus})));
}

/* Basisbloecke haengen an ihrem Modul, eigene Bloecke an ihrem eigenen
   Schalter — beide werden ueber die Chip-Zeile ein- und ausgeblendet.       */
function sichtbar(cat){
  if(cat.eigen) return !cat.aus;
  return !cat.modul || S.mods[cat.modul];
}
function alleItems(cat){
  const base = cat.items.map((it,i)=>({id:cat.id+"-"+i, label:it[0], note:it[1]}));
  const eigen = (S.extra[cat.id]||[]).map(e=>({id:e.id, label:e.label, eigen:true}));
  return base.concat(eigen);
}

function chips(){
  const box = document.getElementById("chips");
  box.innerHTML = "";
  MODULE.forEach(([id,name])=>{
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = name;
    b.setAttribute("aria-pressed", S.mods[id] ? "true" : "false");
    b.onclick = ()=>{ S.mods[id] = !S.mods[id]; save(); chips(); render(); };
    box.appendChild(b);
  });
  /* Eigene Bloecke hinter den Reisearten: derselbe Schalter, dazu ein
     abgetrennter Bereich zum Entfernen. Der Chip ist deshalb kein Knopf,
     sondern eine Huelle um zwei — ein Knopf im Knopf waere ungueltig.       */
  S.kat.forEach(k=>{
    const huelle = document.createElement("span");
    huelle.className = "chip eigen" + (k.aus ? "" : " an");

    const name = document.createElement("button");
    name.className = "chipname"; name.textContent = k.t;
    name.setAttribute("aria-pressed", k.aus ? "false" : "true");
    name.onclick = ()=>{
      if(k.aus) delete k.aus; else k.aus = 1;
      save(); chips(); render();
    };

    const weg = document.createElement("button");
    weg.className = "chipweg";
    weg.setAttribute("aria-label", 'Block "' + k.t + '" entfernen');
    weg.title = "Block entfernen";
    weg.innerHTML = muelleimer(12);
    weg.onclick = ()=> blockEntfernen(k);

    huelle.append(name, weg);
    box.appendChild(huelle);
  });

  /* Kein Modul, sondern der Weg zu einem eigenen Block — deshalb abgesetzt
     gestrichelt und ohne aria-pressed.                                      */
  const neu = document.createElement("button");
  neu.className = "chip neu"; neu.textContent = "Neu";
  neu.title = "Eigenen Block anlegen";
  neu.onclick = blockAnlegen;
  box.appendChild(neu);
}

function muelleimer(px){
  return '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '"'
    + ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"'
    + ' stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M4 7h16M10 4h4M7 7l1 13h8l1-13M10 11v6M14 11v6"/></svg>';
}

/* Wird von der Ecke im Block und vom Chip aus aufgerufen. */
async function blockEntfernen(cat){
  const anzahl = (S.extra[cat.id]||[]).length;
  const ja = await dialog("Block entfernen",
    'Soll der Block "' + cat.t + '" wirklich entfernt werden?'
    + (anzahl ? " Die " + anzahl + (anzahl === 1 ? " Eintrag" : " Einträge")
              + " darin gehen mit verloren." : ""),
    [["Entfernen", true, "gefahr"], ["Abbrechen", false]]);
  if(!ja) return;
  (S.extra[cat.id]||[]).forEach(e => delete S.done[e.id]);
  delete S.extra[cat.id];
  delete S.zu[cat.id];
  S.kat = S.kat.filter(k => k.id !== cat.id);
  save(); chips(); render();
}

/* Fragt nach der Bezeichnung und haengt den Block an. Gleichlautende
   Bezeichnungen bekommen eine Nummer: Beim Zusammenfuehren werden eigene
   Bloecke ueber ihre Bezeichnung abgeglichen, zwei gleiche wuerden dort
   verschmelzen.                                                             */
async function blockAnlegen(){
  const name = await dialogEingabe("Eigener Block",
    "Wie soll der neue Block heißen?", "Neu");
  if(!name) return;
  let titel = name, n = 2;
  const belegt = t => kategorien().some(c => c.t.toLowerCase() === t.toLowerCase());
  while(belegt(titel)) titel = name + " " + (n++);
  S.kat.push({id:neueKatId(), t:titel});
  save(); chips(); render();
}

function render(){
  app.innerHTML = "";
  let gesamt = 0, fertig = 0, sichtbareBloecke = 0;

  kategorien().forEach(cat=>{
    if(!sichtbar(cat)) return;
    sichtbareBloecke++;
    const items = alleItems(cat);
    const n = items.length, k = items.filter(i=>S.done[i.id]).length;
    gesamt += n; fertig += k;

    const sec = document.createElement("section");
    sec.className = (cat.flag==="wichtig" ? "wichtig " : "") + (cat.modul ? "modul " : "")
                  + (cat.eigen ? "eigen " : "") + (S.zu[cat.id] ? "zu" : "");

    const head = document.createElement("button");
    head.className = "head";
    head.innerHTML = '<span class="caret">▼</span><h2></h2><span class="count"></span>';
    head.querySelector("h2").textContent = cat.t;
    head.querySelector(".count").textContent = k + "/" + n;
    head.onclick = ()=>{ S.zu[cat.id] = !S.zu[cat.id]; save(); render(); };
    sec.appendChild(head);

    /* Abgetrennte Ecke oben rechts zum Entfernen. Sie liegt neben dem Kopf,
       nicht darin: Eine Schaltflaeche in einer Schaltflaeche waere ungueltig
       und liesse sich mit der Tastatur nicht erreichen.                     */
    if(cat.eigen) sec.appendChild(loeschecke(cat));

    const ul = document.createElement("ul");
    let offen = 0;
    items.forEach(it=>{
      const li = document.createElement("li");
      const ok = !!S.done[it.id];
      if(ok) li.className = "ok";
      if(S.filter && ok) li.className += " hide"; else offen++;

      const row = document.createElement("button");
      row.className = "row";
      row.setAttribute("aria-pressed", ok ? "true" : "false");
      const box = document.createElement("span");
      box.className = "box"; box.textContent = "✓";
      const txt = document.createElement("span");
      txt.className = "txt"; txt.textContent = it.label;
      if(it.note){ const em = document.createElement("em"); em.textContent = it.note; txt.appendChild(em); }
      row.append(box, txt);
      row.onclick = ()=>{
        if(S.done[it.id]) delete S.done[it.id]; else S.done[it.id] = 1;
        save(); render();
      };
      li.appendChild(row);

      if(it.eigen){
        const del = document.createElement("button");
        del.className = "del"; del.textContent = "×";
        del.setAttribute("aria-label","Eintrag löschen");
        del.onclick = (ev)=>{
          ev.stopPropagation();
          S.extra[cat.id] = (S.extra[cat.id]||[]).filter(e=>e.id!==it.id);
          delete S.done[it.id]; save(); render();
        };
        li.style.display = "flex"; li.style.alignItems = "center";
        li.appendChild(del);
      }
      ul.appendChild(li);
    });
    if(S.filter && offen===0){
      const p = document.createElement("div");
      p.className = "leer"; p.textContent = "Alles gepackt.";
      ul.appendChild(p);
    }
    sec.appendChild(ul);

    const add = document.createElement("div");
    add.className = "add";
    const inp = document.createElement("input");
    inp.type = "text"; inp.placeholder = "Eigener Eintrag";
    inp.enterKeyHint = "done";
    const btn = document.createElement("button");
    btn.textContent = "Hinzufügen";
    const go = ()=>{
      const v = inp.value.trim(); if(!v) return;
      (S.extra[cat.id] = S.extra[cat.id]||[]).push({id:cat.id+"-x"+Date.now(), label:v});
      inp.value = ""; save(); render();
    };
    btn.onclick = go;
    inp.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
    add.append(inp, btn);

    sec.appendChild(add);

    app.appendChild(sec);
  });

  if(!sichtbareBloecke){
    app.innerHTML = '<div class="leer">Keine Blöcke aktiv. Oben eine Reiseart wählen.</div>';
  }
  kopf(fertig, gesamt);
  document.getElementById("foot").textContent = fertig + " von " + gesamt + " erledigt · " + MODE;
}

/* Die diagonal abgetrennte Ecke oben rechts eines eigenen Blocks. Der
   Muelleimer ist als SVG eingebettet — eine Zeichensatz-Alternative gibt es
   nicht, die auf allen Geraeten gleich aussieht.                            */
function loeschecke(cat){
  const b = document.createElement("button");
  b.className = "blockweg";
  b.setAttribute("aria-label", 'Block "' + cat.t + '" entfernen');
  b.title = "Block entfernen";
  b.innerHTML = muelleimer(15);
  b.onclick = ()=> blockEntfernen(cat);
  return b;
}

function kopf(fertig, gesamt){
  const q = gesamt ? fertig/gesamt : 0;
  document.getElementById("bar").style.width = (q*100).toFixed(1) + "%";
  const l1 = "P<PACKLISTE<<URLAUB<<<<<<<<<<<<<<<<<<<<<<";
  let l2 = ("GEPACKT<" + fertig + "<VON<" + gesamt + "<").replace(/ /g,"<");
  while(l2.length < l1.length) l2 += "<";
  l2 = l2.slice(0, l1.length);
  const n = Math.round(q * l1.length);
  const zeile = s => s.split("").map((c,i)=>'<span class="'+(i<n?"on":"")+'">'+c+'</span>').join("");
  document.getElementById("mrz").innerHTML = "<div>"+zeile(l1)+"</div><div>"+zeile(l2)+"</div>";
}

/* ---------------- Werkzeugleiste ---------------- */
document.getElementById("filter").onclick = function(){
  S.filter = !S.filter;
  this.setAttribute("aria-pressed", S.filter ? "true" : "false");
  this.textContent = S.filter ? "Alles zeigen" : "Nur Offenes zeigen";
  save(); render();
};
document.getElementById("fold").onclick = function(){
  const sichtbareIds = kategorien().filter(sichtbar).map(c=>c.id);
  const alleZu = sichtbareIds.every(id=>S.zu[id]);
  sichtbareIds.forEach(id=>{ if(alleZu) delete S.zu[id]; else S.zu[id] = 1; });
  this.textContent = alleZu ? "Alle einklappen" : "Alle aufklappen";
  save(); render();
};
document.getElementById("reset").onclick = ()=>{
  if(!confirm("Alle Haken entfernen? Eigene Einträge und die Reiseart bleiben erhalten.")) return;
  S.done = {}; save(); render();
};

/* ---------------- Teilen ----------------
   Ein Fenster mit fester Auswahl. confirm() reicht hier nicht, weil beim
   geteilten Link drei Antworten moeglich sein muessen.                      */
function dialog(titel, text, wahlen){
  return new Promise(fertig=>{
    const hg = document.createElement("div");
    hg.className = "dialog";
    const karte = document.createElement("div");
    karte.className = "karte";
    const h = document.createElement("h3"); h.textContent = titel;
    const p = document.createElement("p"); p.textContent = text;
    karte.append(h, p);
    const zeile = document.createElement("div");
    zeile.className = "wahl";
    wahlen.forEach(([beschriftung, wert, art])=>{
      const b = document.createElement("button");
      b.textContent = beschriftung;
      if(art) b.className = art;
      b.onclick = ()=>{ hg.remove(); fertig(wert); };
      zeile.appendChild(b);
    });
    karte.appendChild(zeile);
    hg.appendChild(karte);
    hg.onclick = ev => { if(ev.target === hg){ hg.remove(); fertig(null); } };
    document.body.appendChild(hg);
    const erster = zeile.querySelector("button");
    if(erster) erster.focus();
  });
}

/* Dasselbe Fenster mit einem Eingabefeld. Liefert die Eingabe oder null. */
function dialogEingabe(titel, text, vorgabe){
  return new Promise(fertig=>{
    const hg = document.createElement("div");
    hg.className = "dialog";
    const karte = document.createElement("div");
    karte.className = "karte";
    const h = document.createElement("h3"); h.textContent = titel;
    const p = document.createElement("p"); p.textContent = text;
    const feld = document.createElement("input");
    feld.type = "text"; feld.value = vorgabe || ""; feld.className = "eingabe";
    feld.enterKeyHint = "done";
    karte.append(h, p, feld);
    const zeile = document.createElement("div"); zeile.className = "wahl";
    const ok = document.createElement("button"); ok.textContent = "Anlegen";
    const ab = document.createElement("button"); ab.textContent = "Abbrechen";
    const nimm = ()=>{ const v = feld.value.trim(); hg.remove(); fertig(v || null); };
    ok.onclick = nimm;
    ab.onclick = ()=>{ hg.remove(); fertig(null); };
    feld.addEventListener("keydown", e=>{ if(e.key==="Enter") nimm(); });
    zeile.append(ok, ab);
    karte.appendChild(zeile);
    hg.appendChild(karte);
    hg.onclick = ev => { if(ev.target === hg){ hg.remove(); fertig(null); } };
    document.body.appendChild(hg);
    feld.focus(); feld.select();
  });
}

document.getElementById("teilen").onclick = async function(){
  const url = teilLink();
  let kopiert = false;
  try{ await navigator.clipboard.writeText(url); kopiert = true; }catch(e){}

  const hg = document.createElement("div");
  hg.className = "dialog";
  const karte = document.createElement("div");
  karte.className = "karte";
  const h = document.createElement("h3"); h.textContent = "Liste teilen";
  const p = document.createElement("p");
  p.textContent = kopiert
    ? "Der Link liegt in der Zwischenablage. Wer ihn öffnet, bekommt deine Liste mit allen Haken, eigenen Einträgen und Kategorien."
    : "Diesen Link weitergeben. Wer ihn öffnet, bekommt deine Liste mit allen Haken, eigenen Einträgen und Kategorien.";
  const feld = document.createElement("input");
  feld.type = "text"; feld.readOnly = true; feld.value = url; feld.className = "linkfeld";
  karte.append(h, p, feld);
  const zeile = document.createElement("div"); zeile.className = "wahl";
  const zu = document.createElement("button"); zu.textContent = "Schließen";
  zu.onclick = ()=> hg.remove();
  zeile.appendChild(zu);
  karte.appendChild(zeile);
  hg.appendChild(karte);
  hg.onclick = ev => { if(ev.target === hg) hg.remove(); };
  document.body.appendChild(hg);
  feld.focus(); feld.select();
};

/* Der Stand aus einem geteilten Link. Ohne eigenen Stand wird er einfach
   uebernommen, sonst entscheidet der Empfaenger.                           */
async function geteiltesUebernehmen(){
  if(!hatEigenen){
    S = geteilterStand;
    setStatus("geteilte Liste übernommen");
    return;
  }
  const wahl = await dialog(
    "Geteilte Liste geöffnet",
    "Du hast bereits eine eigene Liste. Was soll mit der geteilten geschehen?",
    [["Zusammenführen", "misch"],
     ["Nur die geteilte", "fremd"],
     ["Eigene behalten", "eigen"]]);
  if(wahl === "misch"){
    S = zusammenfuehren(S, geteilterStand);
    setStatus("Listen zusammengeführt");
  }else if(wahl === "fremd"){
    S = geteilterStand;
    setStatus("geteilte Liste übernommen");
  }else{
    setStatus("eigene Liste behalten");
  }
}

/* ---------------- Offline-Betrieb ---------------- */
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

/* ---------------- Start ---------------- */
(async ()=>{
  try{ await load(); }catch(e){ ladefehler = true; }
  if(!S.kat) S.kat = [];
  /* Die Vorauswahl erst setzen, wenn feststeht, dass kein geteilter Stand
     kommt — sonst waeren Flug und Strand nach dem Zusammenfuehren immer an. */
  if(!Object.keys(S.mods).length && !geteilterStand) S.mods = {flug:true, strand:true};
  document.getElementById("filter").textContent = S.filter ? "Alles zeigen" : "Nur Offenes zeigen";
  document.getElementById("filter").setAttribute("aria-pressed", S.filter ? "true" : "false");
  chips(); render();

  if(geteilterStand){
    await geteiltesUebernehmen();
    if(!S.kat) S.kat = [];
    if(!Object.keys(S.mods).length) S.mods = {flug:true, strand:true};
    chips(); render();
  }

  if(ladefehler) setStatus("Stand unlesbar");
  else save();   // schreibt einmal in alle Ablagen und meldet, welche greift
})();
