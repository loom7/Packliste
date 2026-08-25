/* Packliste — Aufbau der Oberflaeche, Bedienung, Start
   Aufbau des Projekts: siehe CLAUDE.md */

/* ---------------- Aufbau ---------------- */
const app = document.getElementById("app");

function sichtbar(cat){ return !cat.modul || S.mods[cat.modul]; }
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
}

function render(){
  app.innerHTML = "";
  let gesamt = 0, fertig = 0, sichtbareBloecke = 0;

  DATA.forEach(cat=>{
    if(!sichtbar(cat)) return;
    sichtbareBloecke++;
    const items = alleItems(cat);
    const n = items.length, k = items.filter(i=>S.done[i.id]).length;
    gesamt += n; fertig += k;

    const sec = document.createElement("section");
    sec.className = (cat.flag==="wichtig" ? "wichtig " : "") + (cat.modul ? "modul " : "") + (S.zu[cat.id] ? "zu" : "");

    const head = document.createElement("button");
    head.className = "head";
    head.innerHTML = '<span class="caret">▼</span><h2></h2><span class="count"></span>';
    head.querySelector("h2").textContent = cat.t;
    head.querySelector(".count").textContent = k + "/" + n;
    head.onclick = ()=>{ S.zu[cat.id] = !S.zu[cat.id]; save(); render(); };
    sec.appendChild(head);

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
  const sichtbareIds = DATA.filter(sichtbar).map(c=>c.id);
  const alleZu = sichtbareIds.every(id=>S.zu[id]);
  sichtbareIds.forEach(id=>{ if(alleZu) delete S.zu[id]; else S.zu[id] = 1; });
  this.textContent = alleZu ? "Alle einklappen" : "Alle aufklappen";
  save(); render();
};
document.getElementById("reset").onclick = ()=>{
  if(!confirm("Alle Haken entfernen? Eigene Einträge und die Reiseart bleiben erhalten.")) return;
  S.done = {}; save(); render();
};

/* ---------------- Offline-Betrieb ---------------- */
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

/* ---------------- Start ---------------- */
(async ()=>{
  try{ await load(); }catch(e){ ladefehler = true; }
  if(!Object.keys(S.mods).length) S.mods = {flug:true, strand:true};
  document.getElementById("filter").textContent = S.filter ? "Alles zeigen" : "Nur Offenes zeigen";
  document.getElementById("filter").setAttribute("aria-pressed", S.filter ? "true" : "false");
  chips(); render();
  if(ladefehler) setStatus("Stand unlesbar");
  else save();   // schreibt einmal in alle Ablagen und meldet, welche greift
})();
