/* Packliste — Kodierung und Ablage des Stands
   Aufbau des Projekts: siehe CLAUDE.md */

/* ---------------- Zustand & Speicherung ----------------
   Der Stand wird als kompakte Zeichenkette in drei Ablagen geschrieben:
   1. Cookie (funktioniert, sobald die Seite über http/https geöffnet wird)
   2. Adresszeile hinter dem #  (funktioniert auch bei lokal geöffneter Datei)
   3. App-Speicher, falls vorhanden
   Beim Laden gewinnt die Ablage mit dem jüngsten Zeitstempel.            */
const KEY = "packliste:v1";
const COOKIE = "packliste";
let S = {done:{}, mods:{}, extra:{}, zu:{}, kat:[], filter:false};
let saveTimer = null, MODE = "…";

const BASEIDS = [];
DATA.forEach(c => c.items.forEach((_,i) => BASEIDS.push(c.id+"-"+i)));

const b64 = bytes => {
  let s = ""; bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const unb64 = str => {
  let s = str.replace(/-/g,"+").replace(/_/g,"/");
  while(s.length % 4) s += "=";
  const bin = atob(s), a = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) a[i] = bin.charCodeAt(i);
  return a;
};

const utf8b64 = s => b64(new TextEncoder().encode(s));
const b64utf8 = s => new TextDecoder().decode(unb64(s));

/* Trennzeichen ist der Punkt: Er wird weder in der Adresszeile noch im Cookie
   umkodiert. Der gesamte Stand besteht damit nur aus A–Z a–z 0–9 - _ .        */
function encode(){
  const bits = new Uint8Array(Math.ceil(BASEIDS.length/8));
  BASEIDS.forEach((id,i)=>{ if(S.done[id]) bits[i>>3] |= 1<<(i&7); });
  let mods = 0; MODULE.forEach(([m],i)=>{ if(S.mods[m]) mods |= 1<<i; });
  let zu   = 0; DATA.forEach((c,i)=>{ if(S.zu[c.id]) zu |= 1<<i; });
  const cust = [];
  Object.keys(S.extra).forEach(c => (S.extra[c]||[]).forEach(e =>
    cust.push([c, e.label, S.done[e.id] ? 1 : 0])));
  /* Eigene Kategorien stehen nicht in DATA, ihr Einklappzustand passt also
     nicht in die Bitmaske oben und reist im Datensatz selbst mit.           */
  const kat = S.kat.map(k => [k.id, k.t, S.zu[k.id] ? 1 : 0]);
  return ["1", Date.now().toString(36), b64(bits), mods.toString(36),
          zu.toString(36), S.filter ? "1" : "0",
          cust.length ? utf8b64(JSON.stringify(cust)) : "",
          kat.length ? utf8b64(JSON.stringify(kat)) : ""].join(".");
}

function decode(str){
  try{
    let s = String(str||"");
    if(s.indexOf("%") > -1){ try{ s = decodeURIComponent(s); }catch(e){} }
    const p = s.split(s.indexOf(".") > -1 ? "." : "|");   // "|" = alte Fassung
    if(p[0] !== "1" || p.length < 6) return null;
    const st = {done:{}, mods:{}, extra:{}, zu:{}, kat:[], filter:p[5]==="1",
                ts:parseInt(p[1],36)||0};
    const bits = unb64(p[2]);
    BASEIDS.forEach((id,i)=>{ if(bits[i>>3] & (1<<(i&7))) st.done[id] = 1; });
    const mods = parseInt(p[3],36)||0;
    MODULE.forEach(([m],i)=>{ if(mods & (1<<i)) st.mods[m] = 1; });
    const zu = parseInt(p[4],36)||0;
    DATA.forEach((c,i)=>{ if(zu & (1<<i)) st.zu[c.id] = 1; });
    if(p[6]){
      const roh = p[6].charAt(0) === "[" ? p[6] : b64utf8(p[6]);
      JSON.parse(roh).forEach((e,i)=>{
        const id = e[0]+"-x"+i;
        (st.extra[e[0]] = st.extra[e[0]]||[]).push({id:id, label:e[1]});
        if(e[2]) st.done[id] = 1;
      });
    }
    if(p[7]){          // Feld 8 fehlt in Staenden vor den eigenen Kategorien
      JSON.parse(b64utf8(p[7])).forEach(k=>{
        st.kat.push({id:k[0], t:k[1]});
        if(k[2]) st.zu[k[0]] = 1;
      });
    }
    return st;
  }catch(err){ return null; }
}

/* ---------------- Eigene Kategorien ----------------
   Kennungen laufen durch und werden nie wiederverwendet: Ein geloeschter
   Eintrag darf die Zuordnung der uebrigen nicht verschieben.               */
function neueKatId(){
  let n = 0;
  S.kat.forEach(k => { const m = /^k(\d+)$/.exec(k.id); if(m) n = Math.max(n, +m[1]); });
  return "k" + (n+1);
}

/* ---------------- Teilen und Zusammenfuehren ----------------
   Ein geteilter Link traegt den kompletten Stand hinter "#g=". Das eigene
   Speichern benutzt "#p=" — so laesst sich beim Laden unterscheiden, ob da
   der eigene Stand von zuletzt steht oder der von jemand anderem.          */
function teilLink(){
  return location.origin + location.pathname + "#g=" + encode();
}
function geteiltLesen(){
  try{
    const m = location.hash.match(/[#&]g=([^&]*)/);
    if(!m) return "";
    let v = m[1];
    if(v.indexOf("%") > -1){ try{ v = decodeURIComponent(v); }catch(e){} }
    return v;
  }catch(e){ return ""; }
}

/* Zwei Staende vereinigen. Haken der Basisliste und Module lassen sich ueber
   ihre Kennung vergleichen, eigene Kategorien und Eintraege nicht: Deren
   laufende Nummern entstehen auf jedem Geraet unabhaengig, "k1" bei dir und
   "k1" bei mir sind nicht dasselbe. Beide werden deshalb ueber ihre
   Bezeichnung zusammengefuehrt und bekommen neue Kennungen.                */
function zusammenfuehren(eigen, fremd){
  const norm = t => String(t||"").trim().toLowerCase();
  const neu = {done:{}, mods:{}, extra:{}, zu:{}, kat:[],
               filter:eigen.filter, ts:Date.now()};
  const seiten = [[eigen,"e"], [fremd,"f"]];

  BASEIDS.forEach(id => { if(eigen.done[id] || fremd.done[id]) neu.done[id] = 1; });
  MODULE.forEach(([m]) => { if(eigen.mods[m] || fremd.mods[m]) neu.mods[m] = 1; });
  DATA.forEach(c => { if(eigen.zu[c.id]) neu.zu[c.id] = 1; });

  const abbild = {};                 // Kennung je Seite -> Kennung im Ergebnis
  seiten.forEach(([st,seite])=>{
    (st.kat||[]).forEach(k=>{
      const treffer = neu.kat.find(x => norm(x.t) === norm(k.t));
      if(treffer){ abbild[seite+k.id] = treffer.id; return; }
      const id = "k" + (neu.kat.length + 1);
      neu.kat.push({id:id, t:k.t});
      abbild[seite+k.id] = id;
      if(st.zu[k.id]) neu.zu[id] = 1;
    });
  });

  const bekannt = id => DATA.some(c=>c.id===id) || neu.kat.some(k=>k.id===id);
  const gesehen = {};
  let lauf = 0;
  seiten.forEach(([st,seite])=>{
    Object.keys(st.extra||{}).forEach(cat=>{
      const ziel = abbild[seite+cat] || cat;   // Basisbloecke behalten ihre Kennung
      if(!bekannt(ziel)) return;               // Kategorie existiert nicht mehr
      (st.extra[cat]||[]).forEach(e=>{
        /* Kennungen enthalten nie einen senkrechten Strich, der Schluessel
           aus Kategorie und Bezeichnung ist damit eindeutig.               */
        const schluessel = ziel + "|" + norm(e.label);
        let id = gesehen[schluessel];
        if(!id){
          id = ziel + "-x" + (lauf++);
          gesehen[schluessel] = id;
          (neu.extra[ziel] = neu.extra[ziel]||[]).push({id:id, label:e.label});
        }
        if(st.done[e.id]) neu.done[id] = 1;
      });
    });
  });
  return neu;
}

/* --- Ablage 0: localStorage (auf https die zuverlässigste Ablage) --- */
function lsSchreiben(v){
  try{ localStorage.setItem(KEY, v); return localStorage.getItem(KEY) === v; }
  catch(e){ return false; }
}
function lsLesen(){
  try{ return localStorage.getItem(KEY) || ""; }catch(e){ return ""; }
}

/* --- Ablage 1: Cookie --- */
function cookieSchreiben(v){
  try{
    document.cookie = COOKIE+"="+v+"; max-age=31536000; path=/; SameSite=Lax";
    return cookieLesen() === v;
  }catch(e){ return false; }
}
function cookieLesen(){
  try{
    const m = document.cookie.match(/(?:^|;\s*)packliste=([^;]*)/);
    return m ? m[1] : "";
  }catch(e){ return ""; }
}

/* --- Ablage 2: Adresszeile ---
   Bei einer lokal geöffneten Datei ist die Herkunft "null"; Chrome lehnt dort
   history.replaceState ab. Deshalb der Rückfall auf location.replace, der den
   Verlauf ersetzt statt bei jedem Haken einen neuen Eintrag anzulegen.        */
let hashOK = false;
function hashSchreiben(v){
  if(location.hash === "#p="+v) return hashOK;
  try{
    history.replaceState(null, "", "#p="+v);
    hashOK = hashLesen() === v;
    if(hashOK) return true;
  }catch(e){}
  try{
    location.replace("#p="+v);
    hashOK = hashLesen() === v;
    return hashOK;
  }catch(e2){
    try{ location.hash = "p="+v; hashOK = hashLesen() === v; return hashOK; }
    catch(e3){ return false; }
  }
}
function hashLesen(){
  try{
    const m = location.hash.match(/[#&]p=([^&]*)/);
    if(!m) return "";
    let v = m[1];
    if(v.indexOf("%") > -1){ try{ v = decodeURIComponent(v); }catch(e){} }
    return v;
  }catch(e){ return ""; }
}

let ladefehler = false;
let geteilterStand = null;   // Stand aus einem geteilten Link, falls einer anliegt
let hatEigenen = false;      // Lag ueberhaupt ein eigener Stand vor?

async function load(){
  const roh = [], kandidaten = [];
  const l = lsLesen();     if(l) roh.push(["Browser-Speicher", l]);
  const c = cookieLesen(); if(c) roh.push(["Cookie", c]);
  const h = hashLesen();   if(h) roh.push(["Adresszeile", h]);
  try{
    const r = await window.storage.get(KEY);
    if(r && r.value) roh.push(["App-Speicher", r.value]);
  }catch(e){}
  roh.forEach(k => { const d = decode(k[1]); if(d) kandidaten.push([k[0], d]); });
  if(kandidaten.length){
    kandidaten.sort((a,b) => (b[1].ts||0) - (a[1].ts||0));
    S = kandidaten[0][1];
    hatEigenen = true;
  }else if(roh.length){
    ladefehler = true;   // Es lag etwas vor, war aber unlesbar
  }
  /* Der geteilte Link wird bewusst nicht in die Auswahl oben geworfen: Sein
     Zeitstempel wuerde sonst ueber fremd oder eigen entscheiden, und der
     Empfaenger verloere seinen Stand, ohne gefragt worden zu sein.          */
  const g = geteiltLesen();
  if(g){ const d = decode(g); if(d) geteilterStand = d; }
}

function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    const v = encode();
    const okLS     = lsSchreiben(v);
    const okCookie = cookieSchreiben(v);
    const okHash   = hashSchreiben(v);
    let okStore = false;
    try{ await window.storage.set(KEY, v); okStore = true; }catch(e){}

    const zahl = [okLS, okCookie, okHash, okStore].filter(Boolean).length;
    MODE = okLS     ? "gespeichert (Browser-Speicher)"
         : okCookie ? "gespeichert (Cookie)"
         : okStore  ? "gespeichert (App-Speicher)"
         : okHash   ? "gesichert in der Adresszeile"
         : "NICHT gespeichert";
    if(zahl > 1) MODE += " · " + zahl + " Ablagen";
    setStatus(zahl ? "gespeichert" : "nicht gespeichert");
    const f = document.getElementById("foot");
    if(f) f.textContent = f.textContent.replace(/ · .*$/, "") + " · " + MODE;
  }, 300);
}
function setStatus(t){ document.getElementById("status").textContent = t; }
