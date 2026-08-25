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
let S = {done:{}, mods:{}, extra:{}, zu:{}, filter:false};
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
  return ["1", Date.now().toString(36), b64(bits), mods.toString(36),
          zu.toString(36), S.filter ? "1" : "0",
          cust.length ? utf8b64(JSON.stringify(cust)) : ""].join(".");
}

function decode(str){
  try{
    let s = String(str||"");
    if(s.indexOf("%") > -1){ try{ s = decodeURIComponent(s); }catch(e){} }
    const p = s.split(s.indexOf(".") > -1 ? "." : "|");   // "|" = alte Fassung
    if(p[0] !== "1" || p.length < 6) return null;
    const st = {done:{}, mods:{}, extra:{}, zu:{}, filter:p[5]==="1",
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
    return st;
  }catch(err){ return null; }
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
  }else if(roh.length){
    ladefehler = true;   // Es lag etwas vor, war aber unlesbar
  }
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
