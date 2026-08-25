/* Packliste — Inhalt der Liste. Hier werden Eintraege gepflegt.
   Aufbau des Projekts: siehe CLAUDE.md */

/* ---------------- Daten ---------------- */
const DATA = [
  {id:"dok", t:"Dokumente & Geld", flag:"wichtig", items:[
    ["Personalausweis"],["Reisepass","Gültigkeit prüfen – viele Länder verlangen 6 Monate über das Reiseende hinaus"],
    ["Visum / ESTA / ETIAS","Frühzeitig beantragen"],["Führerschein","Ggf. internationaler Führerschein"],
    ["Tickets & Bordkarten","Zusätzlich als Screenshot oder Ausdruck"],["Buchungsbestätigung Unterkunft"],
    ["Reiseversicherung / Auslandskrankenversicherung"],["Europäische Krankenversicherungskarte (EHIC)","Rückseite der Versichertenkarte"],
    ["Impfpass"],["Bargeld in Landeswährung"],["Kredit- & Girokarte","PIN im Kopf, Auslandsfreigabe geprüft"],
    ["Kopien aller Dokumente","Einmal in der Cloud, einmal auf Papier – getrennt vom Original"],
    ["Sperrnotruf 116 116 notiert"],["Adresse der Unterkunft offline notiert"],
    ["Notfallkontakte auf Papier"]
  ]},
  {id:"kleid", t:"Kleidung", items:[
    ["Unterwäsche","Pro Tag ein Satz plus zwei Reserve"],["Socken"],["T-Shirts / Tops"],["Hemden / Blusen"],
    ["Hosen / Röcke / Shorts"],["Pullover oder Hoodie"],["Wetterfeste Jacke"],["Regenjacke oder Schirm"],
    ["Schlafanzug"],["Bequeme Schuhe zum Laufen"],["Zweites Paar Schuhe"],["Gürtel"],
    ["Sonnenbrille"],["Mütze oder Cap"],["Ein schickeres Outfit für abends"],["Sportkleidung"]
  ]},
  {id:"bad", t:"Hygiene & Bad", items:[
    ["Zahnbürste & Zahnpasta"],["Zahnseide / Interdentalbürsten"],["Duschgel & Shampoo"],["Deo"],
    ["Rasierer & Rasierschaum"],["Bürste, Kamm, Haargummis"],["Nagelschere, Feile, Pinzette"],
    ["Wattestäbchen & Wattepads"],["Handtuch","Viele Unterkünfte stellen keins – Mikrofaser spart Platz"],
    ["Kosmetik & Abschminktücher"],["Sonnencreme & After Sun"],["Lippenpflege mit Lichtschutz"],
    ["Gesichts- & Körpercreme"],["Parfum"],["Monatshygiene"],
    ["Kontaktlinsen, Pflegemittel, Ersatzbrille"],["Ohrstöpsel & Schlafmaske"],
    ["Taschentücher, Feuchttücher, Handdesinfektion"],["Flüssigkeiten in Reisegröße","Beim Flug: max. 100 ml pro Behälter im 1-Liter-Beutel"]
  ]},
  {id:"med", t:"Reiseapotheke", flag:"wichtig", items:[
    ["Persönliche Medikamente","Menge für die ganze Reise plus Reserve; Beipackzettel oder ärztliche Bescheinigung mitnehmen"],
    ["Schmerz- und Fiebermittel"],["Mittel gegen Durchfall und Übelkeit"],["Elektrolytpulver"],
    ["Pflaster & Blasenpflaster"],["Verbandmaterial & Desinfektionsspray"],["Fieberthermometer"],
    ["Insektenschutz & Stichheiler"],["Hals- und Erkältungsmittel"],["Allergiemittel"],["Gel gegen Sonnenbrand"]
  ]},
  {id:"tech", t:"Technik", items:[
    ["Handy & Ladekabel"],["Powerbank","Muss ins Handgepäck, nicht in den Koffer"],["Kopfhörer"],
    ["Reisestecker-Adapter","Landestandard vorher prüfen"],["Kleine Mehrfachsteckdose","Ein Adapter reicht dann für alles"],
    ["Tablet / E-Reader / Laptop mit Netzteil"],["Kamera, Akkus, Speicherkarten, Ladegerät"],
    ["Ladekabel für Uhr & Kopfhörer"],["Kabeltasche"],["Karten, Musik, Serien offline geladen"],
    ["Roaming oder eSIM geklärt"]
  ]},
  {id:"hand", t:"Handgepäck & unterwegs", items:[
    ["Reisedokumente griffbereit"],["Medikamente im Handgepäck"],["Wechselkleidung im Handgepäck","Falls der Koffer später ankommt"],
    ["Leere Trinkflasche","Nach der Kontrolle auffüllen"],["Snacks"],["Buch oder Zeitschrift"],
    ["Nackenkissen"],["Kugelschreiber","Für Einreiseformulare"],["Jacke oder Schal gegen Klimaanlage"],
    ["Kleiner Müllbeutel"]
  ]},
  {id:"org", t:"Gepäck & Ordnung", items:[
    ["Koffer oder Rucksack"],["Kofferschloss"],["Kofferanhänger mit Adresse"],["Packwürfel oder Beutel"],
    ["Wäschebeutel für Schmutziges"],["Faltbare Zusatztasche für die Rückreise"],["Kulturbeutel"],
    ["Gepäckwaage","Spart Übergepäck am Schalter"],["Tagesrucksack oder Bauchtasche"],["Zip-Beutel für Flüssiges"]
  ]},
  {id:"home", t:"Zuhause vor der Abreise", items:[
    ["Fenster und Türen schließen"],["Heizung herunterdrehen"],["Geräte vom Strom trennen"],
    ["Wasserhähne zu, ggf. Haupthahn"],["Kühlschrank leeren"],["Müll rausbringen"],
    ["Pflanzen gießen oder Gießdienst"],["Post und Nachbarn informieren"],["Schlüssel hinterlegen"],
    ["Reiseroute bei Angehörigen hinterlassen"],["Handy-Backup gemacht"],["Betreuung für Haustiere geklärt"],
    ["Transfer, Taxi oder Parkplatz gebucht"],["Wecker gestellt"]
  ]},

  /* ----- Module ----- */
  {id:"flug", t:"Flugreise", modul:"flug", items:[
    ["Online eingecheckt & Sitzplatz gewählt"],["Bordkarte in der App und als Ausdruck"],
    ["Handgepäckmaße und Gewicht geprüft"],["1-Liter-Beutel für Flüssigkeiten gepackt"],
    ["Nichts über 100 ml im Handgepäck"],["Powerbank & Ersatzakkus im Handgepäck"],
    ["Scharfes und Spitzes in den Aufgabekoffer"],["Anfahrt zum Flughafen geplant"],["Ohrstöpsel & Nackenkissen"]
  ]},
  {id:"auto", t:"Autoreise", modul:"auto", items:[
    ["Fahrzeugschein & Führerschein"],["Grüne Versicherungskarte"],["Warndreieck"],
    ["Warnwesten","In manchen Ländern für jeden Insassen vorgeschrieben"],["Verbandkasten, Haltbarkeit geprüft"],
    ["Vignette oder Mautbox"],["Umweltplakette"],["Reifendruck, Öl, Wischwasser geprüft"],
    ["Ersatzlampen & Abschleppseil"],["Handyhalterung & Kfz-Ladekabel"],["Parkscheibe"],
    ["Getränke und Snacks"],["Ladekabel-Adapter fürs E-Auto"]
  ]},
  {id:"strand", t:"Strand & Baden", modul:"strand", items:[
    ["Badesachen","Zwei Stück – eins trocknet immer"],["Strandtuch"],["Badeschuhe & Flip-Flops"],
    ["Sonnenhut"],["Sonnencreme mit hohem Schutz"],["Strandtasche"],["Wasserdichte Handyhülle"],
    ["Schnorchel & Taucherbrille"],["Luftmatratze oder Schwimmtier"],["Kühltasche"],["Sonnenschirm oder Strandmuschel"],
    ["Buch für den Liegestuhl"]
  ]},
  {id:"berg", t:"Berge & Wandern", modul:"berg", items:[
    ["Eingelaufene Wanderschuhe"],["Wandersocken"],["Kleidung im Zwiebellook"],["Hardshell-Jacke"],
    ["Wanderrucksack 20–30 Liter"],["Trinkblase oder Flaschen"],["Wanderstöcke"],
    ["Karte oder GPX-Tracks offline"],["Stirnlampe"],["Erste-Hilfe-Set & Blasenpflaster"],
    ["Sonnenbrille Kategorie 3","In der Höhe ist die Strahlung deutlich stärker"],["Powerbank"]
  ]},
  {id:"ski", t:"Ski & Winter", modul:"ski", items:[
    ["Skijacke & Skihose"],["Thermounterwäsche"],["Skisocken"],["Handschuhe & Reservepaar"],
    ["Helm"],["Skibrille & Sonnenbrille"],["Mütze & Buff"],["Skipass-Tasche"],
    ["Ski oder Snowboard, Service gemacht"],["Après-Ski-Schuhe mit Profil"],["Wärmepads"],["Fettcreme fürs Gesicht"]
  ]},
  {id:"camp", t:"Camping & Zelt", modul:"camp", items:[
    ["Zelt inklusive Heringe und Gestänge"],["Schlafsack"],["Isomatte & Kissen"],["Campingkocher & Gaskartusche"],
    ["Geschirr, Besteck, Topf"],["Taschenlampe & Stirnlampe"],["Feuerzeug & Streichhölzer"],
    ["Campingstuhl"],["Spülmittel, Schwamm, Geschirrtuch"],["Wasserkanister"],["Müllsäcke"],
    ["Toilettenpapier"],["Taschenmesser"],["Reparaturband"]
  ]},
  {id:"fern", t:"Fernreise & Tropen", modul:"fern", items:[
    ["Einreisebestimmungen und Visum geprüft"],["Impfschutz ärztlich abklären lassen","Mindestens 6–8 Wochen vor Abflug"],
    ["Malariavorsorge ärztlich besprechen"],["Moskitonetz"],["Insektenschutz mit hohem Wirkstoffanteil"],
    ["Leichte, lange Kleidung"],["Wasserentkeimung oder Filter"],["Erweiterte Reiseapotheke"],
    ["Auslandskrankenversicherung mit Rücktransport"],["Landesspezifischer Steckdosenadapter"],["Kopie des Impfpasses"]
  ]},
  {id:"stadt", t:"Städtereise", modul:"stadt", items:[
    ["Wirklich bequeme Schuhe"],["Kleiner Tagesrucksack"],["Offline-Stadtplan"],["Tickets für Museen vorab"],
    ["Nahverkehrs-App oder Ticket"],["Powerbank"],["Taschenschirm"],["Diebstahlsicherer Geldbeutel"],
    ["Restaurantreservierungen"]
  ]},
  {id:"kind", t:"Mit Kindern", modul:"kind", items:[
    ["Lieblingskuscheltier"],["Spielzeug, Mal- und Rätselsachen"],["Snacks und Trinkflasche"],
    ["Reichlich Wechselkleidung"],["Kindersitz oder Sitzerhöhung"],["Schwimmhilfe"],
    ["Kinderreiseapotheke"],["Nachtlicht"],["Kopfhörer & Tablet mit Offline-Inhalten"],
    ["Sonnenhut & Kindersonnencreme"],["Regenponcho"]
  ]},
  {id:"baby", t:"Mit Baby", modul:"baby", items:[
    ["Windeln","Für die ersten Tage plus Reserve, Rest vor Ort kaufen"],["Feuchttücher & Wundcreme"],
    ["Wickelunterlage"],["Fläschchen, Sauger, Nahrung"],["Brei, Löffel, Lätzchen"],["Spucktücher"],
    ["Trage oder Buggy"],["Reisebett"],["Babyphone"],["Schnuller"],["Badetuch mit Kapuze"],
    ["Babysonnencreme & Sonnensegel"]
  ]},
  {id:"biz", t:"Geschäftsreise", modul:"biz", items:[
    ["Anzug oder Kostüm im Kleidersack"],["Gebügelte Hemden oder Blusen"],["Krawatte & Schuhputzzeug"],
    ["Laptop mit Netzteil"],["Präsentation offline verfügbar"],["Adapter für HDMI & USB-C"],
    ["Visitenkarten"],["Notizbuch & Stift"],["Belege für die Reisekostenabrechnung"]
  ]},
  {id:"tier", t:"Haustier dabei", modul:"tier", items:[
    ["EU-Heimtierausweis & Impfnachweis"],["Chipnummer und Marke geprüft"],["Futter, Napf, Wasserflasche"],
    ["Leine, Geschirr, Ersatzleine"],["Transportbox"],["Vertraute Decke oder Körbchen"],
    ["Kotbeutel"],["Zecken- und Flohschutz"],["Maulkorb","In einigen Ländern und im Nahverkehr Pflicht"],
    ["Lieblingsspielzeug"]
  ]}
];

const MODULE = [
  ["flug","Flugreise"],["auto","Autoreise"],["strand","Strand"],["berg","Berge & Wandern"],
  ["ski","Ski & Winter"],["camp","Camping"],["fern","Fernreise"],["stadt","Städtereise"],
  ["kind","Kinder"],["baby","Baby"],["biz","Geschäftlich"],["tier","Haustier"]
];
