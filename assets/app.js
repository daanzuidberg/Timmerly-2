/*
 * Gegenereerd uit "design/Timmerly Prototype v2.dc.html" met `node tools/build.js`.
 * De logica is de ontwerpbron zelf; alleen de koppeling onderaan is toegevoegd.
 */
'use strict';

const NAVY='#0C1A2A', ORANGE='#F26522', DK='#D4531A', BG='#F2F3F5', MID='#DCE0E6', TXT='#6B7280', GREEN='#22C55E', AMBER='#F59E0B';

const PROJECTS=[
  {title:'Aftimmering 84 woningen — Almere Poort', meta:'Van Dijk Bouw · 23 km · start 21 sept · 12 weken', score:'96%', rate:'€47,50 p/u',
   reasons:['8 jaar ervaring aftimmering','Beschikbaar vanaf 14 sept','23 km van project','VCA geldig t/m 2027','Ervaring woningbouw','Eigen vervoer'],
   badges:['ZZP of loondienst','40 u/week','Woningbouw'], coords:[40,50]},
  {title:'Mutatieonderhoud 120 woningen — Zwolle', meta:'Beter Wonen Onderhoud · 31 km · start 28 sept · doorlopend', score:'91%', rate:'€44,00 p/u',
   reasons:['Mutatiewerk in profiel','Binnen reisafstand 40 km','Doorlopende opdracht','VCA geldig','Eigen gereedschap','Vaste contactpersoon'],
   badges:['ZZP','36 u/week','Onderhoud'], coords:[64,32]},
  {title:'Betonbouw parkeergarage — Utrecht', meta:'Kroon Bouw & Infra · 78 km · start 5 okt · 20 weken', score:'78%', rate:'€52,00 p/u',
   reasons:['Betontimmerwerk: beperkte ervaring','Buiten voorkeursregio','Hoger tarief dan gevraagd','VCA VOL vereist','Huisvesting beschikbaar','Lange looptijd'],
   badges:['ZZP','45 u/week','Utiliteit'], coords:[38,66]}
];

const CANDIDATES=[
  {name:'Daan Verhoeven', initials:'DV', meta:'Allround timmerman · Kampen · 8 jaar · 23 km', score:'96%', rate:'€47,50 p/u',
   badges:['ZZP geverifieerd','VCA','4.9 (23)','Snel beschikbaar'],
   reasons:['8 jaar ervaring aftimmering','Beschikbaar vanaf 14 sept','23 km van project','VCA gecertificeerd','Ervaring woningbouw','Eigen vervoer'], coords:[62,36], color:'#F26522'},
  {name:'Youssef El Amrani', initials:'YE', meta:'Betontimmerman · Lelystad · 11 jaar · 34 km', score:'92%', rate:'€51,00 p/u',
   badges:['ZZP geverifieerd','VCA VOL','4.8 (41)'],
   reasons:['11 jaar betontimmerwerk','Beschikbaar vanaf 21 sept','34 km van project','Eigen gereedschap','3 projecten bij Van Dijk','Voorman-ervaring'], coords:[46,46], color:'#3A5298'},
  {name:'Marijn de Wit', initials:'MW', meta:'Mutatietimmerman · Zwolle · 6 jaar · 41 km', score:'88%', rate:'€44,00 p/u',
   badges:['Identiteit geverifieerd','VCA','4.7 (18)'],
   reasons:['Mutatie- en aftimmerwerk','Beschikbaar per direct','41 km van project','Rijbewijs B','Loondienst mogelijk','Reageert binnen 2 uur'], coords:[64,32], color:'#7C3AED'},
  {name:'Bram Sikkema', initials:'BS', meta:'Voorman timmerman · Emmeloord · 15 jaar · 52 km', score:'84%', rate:'€56,00 p/u',
   badges:['ZZP geverifieerd','VCA VOL','BHV','4.9 (66)'],
   reasons:['15 jaar ervaring, voorman','Beschikbaar vanaf 1 okt','52 km van project','Tarief boven indicatie','Ervaring 80+ woningen','Eigen busje'], coords:[54,28], color:'#059669'}
];

const FUNNEL=[
  {label:'Match', tag:'Stap 1 van 6', title:'96% match gevonden', body:'Daan Verhoeven past op ervaring, beschikbaarheid, afstand en certificaten bij Aftimmering 84 woningen.', cta:'Interesse tonen',
   points:[['Matchscore','96%'],['Reden','Ervaring, afstand, VCA'],['Beschikbaar','vanaf 14 sept']]},
  {label:'Interesse', tag:'Stap 2 van 6', title:'Interesse verstuurd', body:'Beide partijen hebben interesse aangegeven. Het gesprek wordt geopend en aan dit project gekoppeld.', cta:'Contact openen',
   points:[['Status','Wederzijdse interesse'],['Reactietijd aannemer','gem. 3 uur'],['Project','Almere Poort']]},
  {label:'Contact', tag:'Stap 3 van 6', title:'Gesprek geopend', body:'Werkzaamheden, werktijden en start zijn besproken in de chat. Stel nu een voorstel op met tarief en looptijd.', cta:'Voorstel opstellen',
   points:[['Startdatum','21 september'],['Werktijden','07:00 – 16:00'],['Werk','Aftimmering, kozijnen']]},
  {label:'Voorstel', tag:'Stap 4 van 6', title:'Voorstel klaar om te versturen', body:'Het voorstel bevat tarief, looptijd, uren en contractvorm. Bij ZZP hoort de compliance-check erbij.', cta:'Voorstel versturen',
   points:[['Tarief','€47,50 p/u'],['Looptijd','12 weken, 40 u/week'],['Contractvorm','ZZP · check vereist']]},
  {label:'Akkoord', tag:'Stap 5 van 6', title:'Beide partijen akkoord', body:'Opdrachtbevestiging is ondertekend en staat in het documentencentrum. De opdracht start op 21 september.', cta:'Opdracht starten',
   points:[['Ondertekend','7 sept, 14:12'],['Documenten','Opdrachtbevestiging, VCA'],['ZZP-check','Laag risico']]},
  {label:'Opdracht', tag:'Stap 6 van 6', title:'Opdracht loopt', body:'Uren worden per week ingediend en goedgekeurd. Na afronding beoordelen beide partijen elkaar.', cta:'Week indienen',
   points:[['Deze week','38,5 uur'],['Goedgekeurd','32 uur'],['Volgende stap','Review na afronding']]}
];

const CF=[
  {id:'gezag', label:'Gezagsverhouding', help:'Wie bepaalt hoe het werk wordt uitgevoerd?',
   options:[['Opdrachtgever stuurt dagelijks aan',0],['Overleg over hoofdlijnen',1],['Vakman bepaalt zelf',2]]},
  {id:'gereedschap', label:'Gereedschap en materiaal', help:'Wie levert het gereedschap en de materialen?',
   options:[['Opdrachtgever levert alles',0],['Deels eigen gereedschap',1],['Eigen gereedschap en bus',2]]},
  {id:'risico', label:'Ondernemersrisico', help:'Wie draagt het risico bij fouten of stilstand?',
   options:[['Geen risico voor vakman',0],['Beperkt risico',1],['Aansprakelijk en verzekerd',2]]},
  {id:'opdrachtgevers', label:'Meerdere opdrachtgevers', help:'Werkt de vakman ook voor anderen?',
   options:[['Alleen deze opdrachtgever',0],['Enkele anderen per jaar',1],['Meerdere gelijktijdig',2]]},
  {id:'inbedding', label:'Inbedding in de organisatie', help:'Doet de vakman hetzelfde werk als vaste medewerkers?',
   options:[['Identiek aan eigen personeel',0],['Deels vergelijkbaar',1],['Afgebakende eigen opdracht',2]]},
  {id:'vervanging', label:'Vervanging', help:'Mag de vakman zich laten vervangen?',
   options:[['Nee, persoonlijk verplicht',0],['Alleen met toestemming',1],['Ja, vrije vervanging',2]]}
];

const STATUS_CYCLE=['Beschikbaar','Beperkt','Niet beschikbaar'];

const CHAT_THREADS=[
  {name:'Daan Verhoeven', project:'Aftimmering 84 woningen — Almere Poort', messages:[
    {who:'Janssen Bouw', text:'Hoi Daan, we starten 21 september met de aftimmering. Ben je dan vrij?', side:0},
    {who:'Daan Verhoeven', text:'Ja, vanaf 14 september ben ik beschikbaar. Werktijden 07:00–16:00?', side:1},
    {who:'Janssen Bouw', text:'Klopt. Voorstel volgt met tarief €47,50 en 40 uur per week.', side:0}
  ]},
  {name:'Youssef El Amrani', project:'Mutatieonderhoud — Zwolle Zuid', messages:[
    {who:'Beter Wonen Onderhoud', text:'We zoeken iemand voor doorlopend mutatiewerk in Zwolle. Interesse?', side:0},
    {who:'Youssef El Amrani', text:'Ja zeker, ik kan vanaf 21 sept beginnen.', side:1}
  ]},
  {name:'Marijn de Wit', project:'Betonbouw parkeergarage — Utrecht', messages:[
    {who:'Kroon Bouw & Infra', text:'Het project in Utrecht loopt 20 weken, huisvesting is geregeld.', side:0},
    {who:'Marijn de Wit', text:'Huisvesting is inderdaad geregeld, top.', side:1}
  ]},
  {name:'Bram Sikkema', project:'Kozijnen renovatie — Deventer', messages:[
    {who:'Bram Sikkema', text:'Bedankt voor de goedkeuring van de uren.', side:1},
    {who:'Janssen Bouw', text:'Graag gedaan, netjes op tijd ingediend.', side:0}
  ]}
];

const PILL='padding:4px 11px;border-radius:2px;font-size:.76rem;font-weight:700;white-space:nowrap;';
const ST_COLORS={'Nieuwe aanmelding':['#E8EDF7','#28405C'],'In beoordeling':['#FEF3C7','#92400E'],'Aanvullende informatie nodig':['#FFEDD5','#9A3412'],'Goedgekeurd':['#DCFCE7','#166534'],'Afgekeurd':['#FEE2E2','#991B1B'],'Inactief':['#EDEFF2','#48546B'],
 'Nieuw':['#E8EDF7','#28405C'],'Gepubliceerd':['#DCFCE7','#166534'],'Matching':['rgba(242,101,34,.14)','#D4531A'],'Ingevuld':['#DCFCE7','#166534'],'Afgerond':['#EDEFF2','#48546B'],
 'Open':['#DCFCE7','#166534'],'Bijna vol':['#FEF3C7','#92400E'],'Ontvangen':['#E8EDF7','#28405C'],'Voorgesteld aan opdrachtgever':['rgba(242,101,34,.14)','#D4531A'],'Gematcht':['#DCFCE7','#166534'],'Niet geselecteerd':['#EDEFF2','#48546B']};
const pillOf=st=>{const c=ST_COLORS[st]||['#EDEFF2','#48546B'];return PILL+'background:'+c[0]+';color:'+c[1];};
const SCREEN_STATUSES=['Nieuwe aanmelding','In beoordeling','Aanvullende informatie nodig','Goedgekeurd','Afgekeurd','Inactief'];
const PROJ_STATUSES=['Nieuw','In beoordeling','Gepubliceerd','Matching','Ingevuld','Afgerond'];

const PUB_PROJECTS=[
 {id:'a1',title:'Allround timmerman – Renovatie',place:'Amsterdam',prov:'Noord-Holland',start:'1 oktober',startCat:'Binnen 1 maand',dur:'6 maanden',durCat:'Langer dan 3 maanden',spec:'Renovatie',work:['Kozijnen en deuren','Wanden en plafonds','Aftimmering'],avail:'2 plekken',rate:'€45 – €50 p/u',status:'Open',km:120,posted:'4 september',
  desc:'Renovatie van 24 bovenwoningen in Amsterdam-West. Je werkt in een vast team van vier timmermannen. De uitvoerder van de aannemer is dagelijks op locatie; Timmerly is je aanspreekpunt voor afspraken en administratie.',
  req:[['Ervaring','Minimaal 3 jaar renovatie'],['Certificaten','VCA Basis'],['Gereedschap','Eigen handgereedschap'],['Vervoer','Eigen vervoer gewenst'],['Werktijden','07:00 – 16:00'],['Startdatum','1 oktober 2026'],['Projectduur','6 maanden'],['Tarief','€45 – €50 p/u, afhankelijk van ervaring']],
  terms:['Opdrachtbevestiging vóór de start, met tarief, looptijd en opzegtermijn','Wekelijkse urenregistratie via Timmerly, goedkeuring door opdrachtgever','Betaling binnen 14 dagen na goedkeuring van de uren','Parkeren op locatie niet mogelijk; OV-vergoeding bespreekbaar']},
 {id:'a2',title:'Timmerman nieuwbouw – 84 woningen',place:'Almere Poort',prov:'Flevoland',start:'21 september',startCat:'Binnen 1 maand',dur:'12 weken',durCat:'1 – 3 maanden',spec:'Nieuwbouw',work:['Aftimmering','Kozijnen','Binnendeuren'],avail:'4 plekken',rate:'€45 – €50 p/u',status:'Open',km:23,posted:'6 september',
  desc:'Aftimmering van 84 grondgebonden woningen. Werk in ploegen van vier onder een voorman van Timmerly.',
  req:[['Ervaring','Minimaal 3 jaar woningbouw'],['Certificaten','VCA Basis'],['Gereedschap','Eigen handgereedschap, elektrisch aanwezig'],['Vervoer','Eigen vervoer vereist'],['Werktijden','07:00 – 16:00, 40 u/week'],['Startdatum','21 september 2026'],['Projectduur','12 weken'],['Tarief','€45 – €50 p/u']],
  terms:['Opdrachtbevestiging vóór de start','Wekelijkse urenregistratie via Timmerly','Betaling binnen 14 dagen na goedkeuring']},
 {id:'a3',title:'Mutatietimmerman – Onderhoud',place:'Zwolle',prov:'Overijssel',start:'Per direct',startCat:'Per direct',dur:'Doorlopend',durCat:'Langer dan 3 maanden',spec:'Onderhoud',work:['Mutatiewerk','Kleine renovaties','Hang- en sluitwerk'],avail:'1 plek',rate:'€42 – €46 p/u',status:'Bijna vol',km:31,posted:'2 september',
  desc:'Doorlopend mutatieonderhoud voor een woningcorporatie in Zwolle. Zelfstandig werken met een eigen planning per week.',
  req:[['Ervaring','Minimaal 2 jaar mutatiewerk'],['Certificaten','VCA Basis'],['Gereedschap','Eigen gereedschap en bus'],['Vervoer','Eigen bus vereist'],['Werktijden','Flexibel, 32 – 40 u/week'],['Startdatum','Per direct'],['Projectduur','Doorlopend, 3 maanden opzegtermijn'],['Tarief','€42 – €46 p/u']],
  terms:['Opdrachtbevestiging vóór de start','Urenregistratie per adres via Timmerly','Betaling binnen 14 dagen na goedkeuring']},
 {id:'a4',title:'Betontimmerman – Parkeergarage',place:'Utrecht',prov:'Utrecht',start:'5 oktober',startCat:'Later',dur:'20 weken',durCat:'Langer dan 3 maanden',spec:'Ruwbouw',work:['Bekisting','Stelwerk','Wapening plaatsen'],avail:'6 plekken',rate:'€50 – €54 p/u',status:'Open',km:78,posted:'1 september',
  desc:'Ruwbouw van een ondergrondse parkeergarage met 400 plaatsen. Huisvesting in de buurt is beschikbaar.',
  req:[['Ervaring','Minimaal 5 jaar betontimmerwerk'],['Certificaten','VCA VOL'],['Gereedschap','Door opdrachtgever'],['Vervoer','Eigen vervoer of huisvesting'],['Werktijden','06:30 – 16:00, 45 u/week'],['Startdatum','5 oktober 2026'],['Projectduur','20 weken'],['Tarief','€50 – €54 p/u']],
  terms:['Opdrachtbevestiging vóór de start','Huisvesting mogelijk in overleg','Betaling binnen 14 dagen na goedkeuring']},
 {id:'a5',title:'Afbouwtimmerman – Kantoorpand',place:'Eindhoven',prov:'Noord-Brabant',start:'14 september',startCat:'Binnen 1 maand',dur:'8 weken',durCat:'1 – 3 maanden',spec:'Afbouw',work:['Systeemwanden','Plafonds','Aftimmering'],avail:'2 plekken',rate:'€44 – €48 p/u',status:'Open',km:140,posted:'5 september',
  desc:'Afbouw van drie verdiepingen kantoorruimte. Strakke planning met oplevering eind november.',
  req:[['Ervaring','Minimaal 3 jaar afbouw'],['Certificaten','VCA Basis'],['Gereedschap','Eigen handgereedschap'],['Vervoer','Eigen vervoer gewenst'],['Werktijden','07:00 – 16:00'],['Startdatum','14 september 2026'],['Projectduur','8 weken'],['Tarief','€44 – €48 p/u']],
  terms:['Opdrachtbevestiging vóór de start','Wekelijkse urenregistratie via Timmerly','Betaling binnen 14 dagen na goedkeuring']},
 {id:'a6',title:'Steltimmerman – Woningbouw',place:'Groningen',prov:'Groningen',start:'2 november',startCat:'Later',dur:'5 weken',durCat:'Korter dan 1 maand',spec:'Stelwerk',work:['Stelwerk kozijnen','Stellen prefab elementen','Maatvoering'],avail:'3 plekken',rate:'€46 – €50 p/u',status:'Open',km:95,posted:'3 september',
  desc:'Stelwerk voor 36 woningen in een nieuwbouwwijk. Ervaring met prefab houtskeletbouw is een pré.',
  req:[['Ervaring','Minimaal 4 jaar stelwerk'],['Certificaten','VCA Basis, hoogwerker gewenst'],['Gereedschap','Eigen handgereedschap'],['Vervoer','Eigen vervoer vereist'],['Werktijden','07:00 – 16:30'],['Startdatum','2 november 2026'],['Projectduur','5 weken'],['Tarief','€46 – €50 p/u']],
  terms:['Opdrachtbevestiging vóór de start','Wekelijkse urenregistratie via Timmerly','Betaling binnen 14 dagen na goedkeuring']}
];
const FILTER_DEFS=[
 ['prov','Provincie',['Noord-Holland','Flevoland','Overijssel','Utrecht','Noord-Brabant','Groningen']],
 ['spec','Specialisme',['Nieuwbouw','Renovatie','Afbouw','Ruwbouw','Onderhoud','Stelwerk']],
 ['startCat','Startdatum',['Per direct','Binnen 1 maand','Later']],
 ['durCat','Projectduur',['Korter dan 1 maand','1 – 3 maanden','Langer dan 3 maanden']],
 ['km','Reisafstand vanaf Kampen',['Tot 25 km','Tot 50 km','Tot 100 km']]
];
const KM_MAX={'Tot 25 km':25,'Tot 50 km':50,'Tot 100 km':100};

const OB_STEPS=[
 {label:'Persoon',title:'Persoonsgegevens',help:'We gebruiken deze gegevens alleen om contact met je op te nemen over je aanmelding en projecten.',
  texts:[['name','Volledige naam','Bijv. Daan Verhoeven'],['email','E-mail','naam@voorbeeld.nl'],['phone','Telefoon','06 12345678'],['city','Woonplaats','Kampen']]},
 {label:'Vak',title:'Vakgebied',help:'Kies alles wat op jou van toepassing is.',
  groups:[['vak','Vakgebied',['Timmerman','Allround timmerman','Ruwbouw','Afbouw','Renovatie','Nieuwbouw','Stelwerk','Betontimmerwerk'],true]]},
 {label:'Ervaring',title:'Ervaring',help:'Hoe meer we weten, hoe beter we projecten kunnen voorstellen.',
  texts:[['specs','Specialisaties','Bijv. kozijnen, aftimmering, trappen'],['history','Recente werkervaring','Bijv. 2024–2026 aftimmering 120 woningen, Bouwgroep Nagel']],
  groups:[['years','Aantal jaren ervaring',['0 – 2 jaar','3 – 5 jaar','6 – 10 jaar','Meer dan 10 jaar'],false]]},
 {label:'Zakelijk',title:'Zakelijke gegevens',help:'Nodig om als zelfstandige te kunnen werken via Timmerly. We controleren het KvK-nummer.',
  texts:[['company','Bedrijfsnaam','Verhoeven Timmerwerken'],['kvk','KvK-nummer','12345678'],['btw','BTW-nummer','NL001234567B01'],['seat','Vestigingsplaats','Kampen']]},
 {label:'Certificaten',title:'Certificaten',help:'Kies wat je hebt. Je kunt de documenten later uploaden; wij verifiëren ze.',
  groups:[['certs','Certificaten',['VCA Basis','VCA VOL','BHV','Hoogwerker','Heftruck','Steigerbouw','Nog geen certificaten'],true]]},
 {label:'Materieel',title:'Materieel',help:'Wat neem je zelf mee naar een project?',
  groups:[['mat','Eigen materieel',['Eigen handgereedschap','Eigen elektrisch gereedschap','Eigen vervoer','Eigen bus','Geen eigen materieel'],true]]},
 {label:'Werkgebied',title:'Werkgebied',help:'Waar wil je werken en hoe ver wil je reizen?',
  groups:[['prov','Provincies',['Noord-Holland','Zuid-Holland','Utrecht','Flevoland','Gelderland','Overijssel','Noord-Brabant','Groningen','Friesland','Drenthe','Zeeland','Limburg'],true],['km','Maximale reisafstand',['25 km','50 km','75 km','100 km of meer'],false]]},
 {label:'Beschikbaar',title:'Beschikbaarheid',help:'Dit kun je later altijd aanpassen in je dashboard.',
  texts:[['from','Beschikbaar vanaf (datum)','Bijv. 1 oktober 2026']],
  groups:[['avail','Beschikbaarheid',['Per direct','Vanaf datum'],false],['days','Dagen per week',['1','2','3','4','5'],false]]},
 {label:'Controle',title:'Controleer je profiel',help:'Klopt alles? Dan registreer je je en beoordelen wij je profiel.',review:true}
];

const APPLICATIONS=[
 {pid:'a2',title:'Timmerman nieuwbouw – 84 woningen',meta:'Almere Poort · aangemeld 6 sept',status:'Voorgesteld aan opdrachtgever'},
 {pid:'a3',title:'Mutatietimmerman – Onderhoud',meta:'Zwolle · aangemeld 2 sept',status:'In beoordeling'},
 {pid:'a5',title:'Afbouwtimmerman – Kantoorpand',meta:'Eindhoven · aangemeld 28 aug',status:'Niet geselecteerd'}
];
const NOTIFS=[
 ['Nieuw project past bij je profiel','Allround timmerman – Renovatie in Amsterdam, 92% match.','Vandaag 08:10',1],
 ['Je aanmelding is voorgesteld','Timmerman nieuwbouw – 84 woningen: de opdrachtgever bekijkt je profiel.','Gisteren',1],
 ['Aanvullende informatie nodig','Upload een kopie van je VCA Basis om je certificaat te laten verifiëren.','Gisteren',0],
 ['Je profiel is goedgekeurd','Welkom bij Timmerly. Je kunt nu interesse tonen in projecten.','4 sept',0],
 ['Project gewijzigd','Mutatietimmerman – Onderhoud: startdatum aangepast naar per direct.','2 sept',0]
];
const ADMIN_CANDS=[
 {id:'c1',name:'Daan Verhoeven',meta:'Allround timmerman · Kampen · 8 jaar',status:'Goedgekeurd',docs:'KvK ✓, VCA Basis ✓, BHV ✓',avail:'Beschikbaar vanaf 14 sept',history:'17 projecten via Timmerly'},
 {id:'c2',name:'Kevin Bakker',meta:'Afbouwtimmerman · Apeldoorn · 4 jaar',status:'In beoordeling',docs:'KvK ✓, VCA Basis (wacht op verificatie)',avail:'Per direct, 4 dagen/week',history:'Nog geen projecten'},
 {id:'c3',name:'R. Novak',meta:'Ruwbouwtimmerman · Almere · 6 jaar',status:'Aanvullende informatie nodig',docs:'KvK-nummer komt niet overeen met bedrijfsnaam',avail:'Vanaf 1 oktober',history:'Nog geen projecten'},
 {id:'c4',name:'Sanne Vos',meta:'Renovatietimmerman · Haarlem · 2 jaar',status:'Nieuwe aanmelding',docs:'Nog geen documenten',avail:'Per direct',history:'Nog geen projecten'},
 {id:'c5',name:'Pieter Smit',meta:'Steltimmerman · Groningen · 12 jaar',status:'Inactief',docs:'KvK ✓, VCA VOL ✓',avail:'Niet beschikbaar tot 2027',history:'6 projecten via Timmerly'}
];
const ADMIN_PROJ=[
 {id:'a2',title:'Timmerman nieuwbouw – 84 woningen',meta:'Van Dijk Bouw · Almere Poort · 4 personen',status:'Matching'},
 {id:'a1',title:'Allround timmerman – Renovatie',meta:'Bouwbedrijf De Wit · Amsterdam · 2 personen',status:'Gepubliceerd'},
 {id:'a7',title:'Dakrenovatie 12 woningen',meta:'Noorderlicht Bouw · Groningen · 2 personen · omschrijving onvolledig',status:'In beoordeling'},
 {id:'a8',title:'Sloopwerk industrieterrein',meta:'Nieuw account · Rotterdam · 5 personen',status:'Nieuw'},
 {id:'a9',title:'Kozijnen renovatie',meta:'Janssen Bouw · Deventer · 1 persoon',status:'Ingevuld'}
];
const SEED_AUDIT=[
 {when:'8 sept 09:14',who:'M. de Jong (Recruiter)',what:'Status gewijzigd: In beoordeling → Goedgekeurd',obj:'Kandidaat Daan Verhoeven'},
 {when:'7 sept 16:40',who:'S. Bakker (Admin)',what:'Project gepubliceerd',obj:'Project Allround timmerman – Renovatie'},
 {when:'7 sept 11:02',who:'M. de Jong (Recruiter)',what:'Notitie toegevoegd',obj:'Kandidaat R. Novak'},
 {when:'6 sept 14:25',who:'Systeem',what:'Nieuwe aanmelding ontvangen, e-mail geverifieerd',obj:'Kandidaat Sanne Vos'}
];

class Component extends DCLogic {
  state = {
    screen: null, role: 'con', device: 'desktop',
    postStep: 1, brief: '', parsed: false,
    stage: 0, swipe: 0, liked: 0, approved: false,
    cf: {gezag:1, gereedschap:2, risico:1, opdrachtgevers:1, inbedding:1, vervanging:0},
    avail: 'Beschikbaar',
    chatThread: 0, chatDraft: '', chatMessages: {},
    calendar: {}, adminTab: 'cands',
    pubFilters: {}, projectId: 'a1', applied: {}, saved: {}, notifRead: false, submitted: false,
    obStep: 0, ob: {}, obChips: {}, registered: false, screening: 'Goedgekeurd',
    settings: {email:'daan@verhoeventimmerwerken.nl', phone:'06 12345678', mail:true, push:false, wa:true, twofa:false},
    candQuery: '', candFilter: 'Alle', selCand: 'c2', candStatus: {}, candNotes: {}, projStatus: {}, matchProj: 'a2', proposed: {}, audit: []
  };
  chip(on) {
    return 'padding:8px 14px;border-radius:2px;font-size:.84rem;font-weight:700;cursor:pointer;border:1.5px solid ' +
      (on ? '#F26522;background:rgba(242,101,34,.08);color:#D4531A' : '#DCE0E6;background:#fff;color:#4B5563');
  }
  log(what, obj) {
    const d = new Date(), when = d.getDate() + ' sept ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    return [{when, who: 'S. Bakker (Admin)', what, obj}].concat(this.state.audit);
  }

  get screen() { return this.state.screen || (this.props.startScreen ?? 'landing'); }
  nav(s) { return () => this.setState({screen:s}); }
  pill(active) {
    return 'padding:6px 13px;border-radius:2px;font-size:.79rem;font-weight:700;cursor:pointer;border:1px solid ' +
      (active ? 'transparent;background:#F26522;color:#fff' : 'rgba(255,255,255,.22);background:none;color:rgba(255,255,255,.75)');
  }

  proName() { return (this.state.registered && this.state.ob.name) || this.props.proName || 'Daan Verhoeven'; }

  extraVals(s, screen, pro, phone) {
    const isPublic = ['landing','projects','project','onboard'].includes(screen);
    const openP = id => () => this.setState({screen: 'project', projectId: id});
    const pubCard = p => ({
      id: p.id, title: p.title, meta: p.place + ' · start ' + p.start + ' · ' + p.dur, work: p.work, rate: p.rate, status: p.status, pill: pillOf(p.status),
      spec: p.spec, avail: p.avail, open: openP(p.id)
    });
    const filtered = PUB_PROJECTS.filter(p => Object.entries(s.pubFilters).every(([k, v]) => !v || (k === 'km' ? p.km <= KM_MAX[v] : p[k] === v)));
    const cur = PUB_PROJECTS.find(p => p.id === s.projectId) || PUB_PROJECTS[0];
    const appliedCur = !!s.applied[cur.id];
    const savedCur = !!s.saved[cur.id];

    // onboarding
    const step = OB_STEPS[s.obStep];
    const setOb = k => e => this.setState({ob: Object.assign({}, s.ob, {[k]: e.target.value})});
    const toggleChip = (g, opt, multi) => () => {
      const curV = s.obChips[g] || [];
      const next = multi ? (curV.includes(opt) ? curV.filter(x => x !== opt) : curV.concat([opt])) : [opt];
      this.setState({obChips: Object.assign({}, s.obChips, {[g]: next})});
    };
    const chipsOf = g => (s.obChips[g] || []).join(', ');
    const review = [
      ['Naam', s.ob.name, 0], ['Contact', [s.ob.email, s.ob.phone, s.ob.city].filter(Boolean).join(' · '), 0],
      ['Vakgebied', chipsOf('vak'), 1], ['Ervaring', [chipsOf('years'), s.ob.specs].filter(Boolean).join(' · '), 2],
      ['Zakelijk', [s.ob.company, s.ob.kvk && 'KvK ' + s.ob.kvk, s.ob.seat].filter(Boolean).join(' · '), 3],
      ['Certificaten', chipsOf('certs'), 4], ['Materieel', chipsOf('mat'), 5],
      ['Werkgebied', [chipsOf('prov'), chipsOf('km')].filter(Boolean).join(' · '), 6],
      ['Beschikbaarheid', [chipsOf('avail'), s.ob.from, chipsOf('days') && chipsOf('days') + ' dagen/week'].filter(Boolean).join(' · '), 7]
    ];
    const last = s.obStep === OB_STEPS.length - 1;
    const register = () => this.setState({registered: true, role: 'pro', screen: 'dash', screening: 'Nieuwe aanmelding', obStep: 0});

    // admin
    const candStatus = c => s.candStatus[c.id] || c.status;
    const projStatus = p => s.projStatus[p.id] || p.status;
    const q = s.candQuery.toLowerCase();
    const cands = ADMIN_CANDS.filter(c => (s.candFilter === 'Alle' || candStatus(c) === s.candFilter) && (!q || (c.name + ' ' + c.meta).toLowerCase().includes(q)));
    const sel = ADMIN_CANDS.find(c => c.id === s.selCand) || ADMIN_CANDS[0];
    const mp = ADMIN_PROJ.find(p => p.id === s.matchProj) || ADMIN_PROJ[0];
    const screeningHints = {
      'Nieuwe aanmelding': 'We hebben je aanmelding ontvangen. Beoordeling volgt binnen 2 werkdagen; tot die tijd kun je projecten bekijken en opslaan.',
      'In beoordeling': 'Een recruiter beoordeelt je profiel en documenten.',
      'Aanvullende informatie nodig': 'We missen nog iets. Bekijk je meldingen voor wat we nodig hebben.',
      'Goedgekeurd': 'Je profiel is gescreend. Je kunt interesse tonen in projecten en wordt voorgesteld aan opdrachtgevers.',
      'Afgekeurd': 'Je profiel voldoet nu niet aan de voorwaarden. Neem contact op met support voor toelichting.',
      'Inactief': 'Je profiel staat op inactief. Zet je beschikbaarheid aan om weer voorgesteld te worden.'
    };
    const toggle = (k, label, hint) => ({
      label, hint, go: () => this.setState({settings: Object.assign({}, s.settings, {[k]: !s.settings[k]})}),
      state: s.settings[k] ? 'Aan' : 'Uit',
      style: 'display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:2px;border:1px solid #DCE0E6;background:#fff;color:#0C1A2A;font-size:.9rem;cursor:pointer',
      knob: PILL + (s.settings[k] ? 'background:#DCFCE7;color:#166534' : 'background:#EDEFF2;color:#48546B')
    });
    const applications = APPLICATIONS.concat(PUB_PROJECTS.filter(p => s.applied[p.id] && !APPLICATIONS.some(a => a.pid === p.id)).map(p => ({pid: p.id, title: p.title, meta: p.place + ' · aangemeld vandaag', status: 'Ontvangen'})));

    return {
      isPublic, isProjects: screen === 'projects', isProject: screen === 'project', isOnboard: screen === 'onboard',
      isApplications: screen === 'applications', isNotifications: screen === 'notifications', isSettings: screen === 'settings',
      goProjects: this.nav('projects'), goOnboard: this.nav('onboard'),
      pubNav: [['projects','Projecten'],['landing','Hoe het werkt'],['con','Voor opdrachtgevers'],['zzp','ZZP & Bouw']].map(([id, label]) => ({
        label, go: id === 'con' ? () => this.setState({role: 'con', screen: 'dash'}) : id === 'zzp' ? () => {} : this.nav(id),
        style: 'background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:2px;font-size:.92rem;font-weight:600;color:' + (screen === id ? '#D4531A' : '#0C1A2A')
      })),
      heroProject: pubCard(PUB_PROJECTS[0]),
      featuredProjects: PUB_PROJECTS.slice(0, 3).map(pubCard),
      howSteps: [
        {n: 1, title: 'Maak je profiel', body: 'Vak, ervaring, certificaten, werkgebied en beschikbaarheid. Eén keer invullen, daarna alleen bijhouden.'},
        {n: 2, title: 'Ontdek passende projecten', body: 'Je ziet projecten die bij je profiel passen, met een duidelijke matchscore en alle voorwaarden vooraf.'},
        {n: 3, title: 'Meld je aan', body: 'Interesse tonen kost één klik. Wij screenen je profiel en bespreken het project met je.'},
        {n: 4, title: 'Wij regelen de match', body: 'Timmerly stelt je voor, legt de afspraken vast en blijft je aanspreekpunt tijdens het project.'}
      ],
      whyPoints: [
        {title: 'Relevante projecten', body: 'Alleen timmerwerk, gefilterd op jouw vak, regio en beschikbaarheid.'},
        {title: 'Gescreende opdrachtgevers', body: 'Elk project wordt beoordeeld voordat het online komt.'},
        {title: 'Persoonlijk contact', body: 'Een vast aanspreekpunt bij Timmerly, geen anoniem ticketsysteem.'},
        {title: 'Administratieve ondersteuning', body: 'Opdrachtbevestiging, urenregistratie en betaling lopen via het platform.'},
        {title: 'Continuïteit', body: 'Loopt je project af, dan kijken we samen naar het volgende.'},
        {title: 'Transparante afspraken', body: 'Tarief, looptijd en voorwaarden staan vast voordat je start.'}
      ],
      proBenefits: ['Gratis profiel, geen abonnement', 'Je bepaalt zelf waar en wanneer je werkt', 'Certificaten één keer verifiëren, overal geldig', 'Uren en betaling via één omgeving'],
      projectCount: filtered.length + ' van ' + PUB_PROJECTS.length + ' projecten',
      filterGroups: FILTER_DEFS.map(([key, label, opts]) => ({
        label, options: opts.map(o => ({
          label: o, go: () => this.setState({pubFilters: Object.assign({}, s.pubFilters, {[key]: s.pubFilters[key] === o ? null : o})}),
          style: 'padding:6px 11px;border-radius:2px;font-size:.8rem;font-weight:700;cursor:pointer;border:1.5px solid ' + (s.pubFilters[key] === o ? '#F26522;background:rgba(242,101,34,.08);color:#D4531A' : '#DCE0E6;background:#fff;color:#4B5563')
        }))
      })),
      clearFilters: () => this.setState({pubFilters: {}}),
      filteredProjects: filtered.map(pubCard),
      noProjects: filtered.length === 0,
      detail: {
        title: cur.title, status: cur.status, pill: pillOf(cur.status), posted: cur.posted, desc: cur.desc, work: cur.work, rate: cur.rate,
        facts: [{k: 'Locatie', v: cur.place + ', ' + cur.prov}, {k: 'Start', v: cur.start}, {k: 'Duur', v: cur.dur}, {k: 'Type', v: cur.spec}],
        reqs: cur.req.map(([k, v]) => ({k, v})), terms: cur.terms,
        availLine: cur.avail + ' · ' + cur.km + ' km vanaf Kampen',
        ctaLabel: appliedCur ? 'Interesse geregistreerd' : 'Interesse in dit project',
        ctaStyle: 'padding:14px;border-radius:2px;border:none;font-weight:700;font-size:.98rem;cursor:pointer;' + (appliedCur ? 'background:#DCFCE7;color:#166534' : 'background:#F26522;color:#fff'),
        interest: () => s.registered || s.role === 'pro' && screen !== 'onboard' && s.screening === 'Goedgekeurd' && !this.props.forceOnboard
          ? this.setState({applied: Object.assign({}, s.applied, {[cur.id]: true})})
          : this.setState({screen: 'onboard'}),
        save: () => this.setState({saved: Object.assign({}, s.saved, {[cur.id]: !savedCur})}),
        saveLabel: savedCur ? 'Opgeslagen' : 'Project opslaan',
        note: appliedCur ? 'Bedankt. Het matchteam neemt binnen 1 werkdag contact met je op.' : 'Nog geen profiel? Interesse tonen start je aanmelding; je gegevens blijven bewaard.'
      },
      obSteps: OB_STEPS.map((st, i) => ({
        label: (i + 1) + '. ' + st.label, go: () => this.setState({obStep: i}),
        style: 'padding:6px 11px;border-radius:2px;font-size:.78rem;font-weight:700;cursor:pointer;border:none;' + (i === s.obStep ? 'background:#0C1A2A;color:#fff' : i < s.obStep ? 'background:#DCFCE7;color:#166534' : 'background:#F2F3F5;color:#6B7280')
      })),
      obProgressLabel: 'Stap ' + (s.obStep + 1) + ' van ' + OB_STEPS.length,
      obBarStyle: 'width:' + Math.round(((s.obStep + 1) / OB_STEPS.length) * 100) + '%;height:100%;background:#F26522',
      obTitle: step.title, obHelp: step.help,
      obTexts: (step.texts || []).map(([k, label, ph]) => ({label, ph, value: s.ob[k] || '', set: setOb(k)})),
      obGroups: (step.groups || []).map(([g, label, opts, multi]) => ({
        label, options: opts.map(o => ({label: o, go: toggleChip(g, o, multi), style: this.chip((s.obChips[g] || []).includes(o))}))
      })),
      obGroupsGap: (step.texts && step.groups) ? '20px' : '0',
      obIsReview: !!step.review,
      obReview: review.map(([k, v, go]) => ({k, v: v || 'Nog niet ingevuld', go: () => this.setState({obStep: go})})),
      obNext: last ? register : () => this.setState({obStep: s.obStep + 1}),
      obNextLabel: last ? 'Registreren' : 'Volgende',
      obPrev: () => this.setState({obStep: Math.max(0, s.obStep - 1)}),
      obCanBack: s.obStep > 0,

      firstName: this.proName().split(' ')[0],
      isApproved: s.screening === 'Goedgekeurd',
      profilePct: s.registered ? '45%' : '82%',
      profilePctHint: s.registered ? 'documenten ontbreken nog' : '+8% met werkhistorie',
      profileBar: 'width:' + (s.registered ? 45 : 82) + '%;height:100%;background:#F26522',
      profileTip: s.registered ? 'Upload je KvK-uittreksel en certificaten om de screening te versnellen.' : 'Voeg 2 afgeronde projecten toe om hoger in matches te komen.',
      dashCerts: (s.registered
        ? ((s.obChips.certs || []).filter(c => c !== 'Nog geen certificaten').slice(0, 3).map(c => [c, 'Nog uploaden', '#F2F3F5', '#6B7280']))
        : [['VCA Basis', 'Verloopt in 30 dagen', '#FEF3C7', '#92400E'], ['BHV', 'Geverifieerd', '#DCFCE7', '#166534'], ['Hoogwerker', 'In behandeling', '#F2F3F5', '#6B7280']])
        .concat(s.registered && !(s.obChips.certs || []).filter(c => c !== 'Nog geen certificaten').length ? [['Geen certificaten opgegeven', 'Toevoegen', '#F2F3F5', '#6B7280']] : [])
        .map(([name, status, bg, fg]) => ({name, status, pill: 'background:' + bg + ';color:' + fg + ';padding:2px 10px;border-radius:2px;font-size:.76rem;font-weight:700'})),
      dashSub: s.screening === 'Goedgekeurd' ? '3 projecten passen bij je profiel binnen 40 km van Kampen' : 'Je aanmelding is ontvangen. We beoordelen je profiel binnen 2 werkdagen.',
      screening: s.screening, screeningPill: pillOf(s.screening), screeningHint: screeningHints[s.screening],
      applications: applications.map(a => ({title: a.title, meta: a.meta, status: a.status, pill: pillOf(a.status), open: openP(a.pid)})),
      notifications: NOTIFS.map(([title, body, when, unread]) => ({
        title, body, when,
        style: 'display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-radius:2px;border:1px solid #DCE0E6;background:' + (unread && !s.notifRead ? '#fff' : '#F7F8F9'),
        dot: 'width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px;background:' + (unread && !s.notifRead ? '#F26522' : '#DCE0E6')
      })),
      markRead: () => this.setState({notifRead: true}),
      setEmail: s.settings.email, setPhone: s.settings.phone,
      setSetEmail: e => this.setState({settings: Object.assign({}, s.settings, {email: e.target.value})}),
      setSetPhone: e => this.setState({settings: Object.assign({}, s.settings, {phone: e.target.value})}),
      secToggles: [toggle('twofa', 'Tweestapsverificatie', 'Extra code via sms of authenticator-app bij inloggen')],
      notifToggles: [toggle('mail', 'E-mail', 'Nieuwe projecten, status van aanmeldingen'), toggle('push', 'Push (app)', 'Beschikbaar zodra de app er is'), toggle('wa', 'WhatsApp', 'Alleen dringende berichten van je contactpersoon')],

      adminTabs: [['cands', 'Kandidaten'], ['projects', 'Projecten'], ['matching', 'Matching'], ['audit', 'Auditlog']].map(([id, label]) => ({
        label, go: () => this.setState({adminTab: id}),
        style: 'padding:8px 16px;border-radius:2px;font-size:.85rem;font-weight:700;cursor:pointer;border:1px solid #DCE0E6;' + (s.adminTab === id ? 'background:#0C1A2A;color:#fff;border-color:#0C1A2A' : 'background:#fff;color:#6B7280')
      })),
      admCands: s.adminTab === 'cands', admProjects: s.adminTab === 'projects', admMatching: s.adminTab === 'matching', admAudit: s.adminTab === 'audit',
      candQuery: s.candQuery, setCandQuery: e => this.setState({candQuery: e.target.value}),
      candFilters: ['Alle'].concat(SCREEN_STATUSES).map(f => ({
        label: f, go: () => this.setState({candFilter: f}),
        style: 'padding:5px 10px;border-radius:2px;font-size:.76rem;font-weight:700;cursor:pointer;border:1px solid ' + (s.candFilter === f ? '#0C1A2A;background:#0C1A2A;color:#fff' : '#DCE0E6;background:#fff;color:#6B7280')
      })),
      candList: cands.map(c => ({
        name: c.name, meta: c.meta, status: candStatus(c), pill: pillOf(candStatus(c)), go: () => this.setState({selCand: c.id}),
        style: 'display:flex;gap:12px;align-items:center;width:100%;padding:14px;border-radius:2px;cursor:pointer;border:1px solid ' + (s.selCand === c.id ? '#F26522' : '#DCE0E6') + ';background:#fff'
      })),
      candEmpty: cands.length === 0,
      selCand: {name: sel.name, meta: sel.meta, status: candStatus(sel), pill: pillOf(candStatus(sel)), docs: sel.docs, avail: sel.avail, history: sel.history},
      candStatusOpts: SCREEN_STATUSES.map(st => ({
        label: st, style: this.chip(candStatus(sel) === st),
        go: () => this.setState({candStatus: Object.assign({}, s.candStatus, {[sel.id]: st}), audit: this.log('Status gewijzigd: ' + candStatus(sel) + ' → ' + st, 'Kandidaat ' + sel.name)})
      })),
      candNote: s.candNotes[sel.id] || '',
      setCandNote: e => this.setState({candNotes: Object.assign({}, s.candNotes, {[sel.id]: e.target.value})}),
      admProjList: ADMIN_PROJ.map(p => {
        const st = projStatus(p), i = PROJ_STATUSES.indexOf(st), nxt = PROJ_STATUSES[i + 1];
        return {
          title: p.title, meta: p.meta, status: st, pill: pillOf(st),
          nextLabel: nxt ? 'Naar ' + nxt : 'Afgerond',
          next: nxt ? () => this.setState({projStatus: Object.assign({}, s.projStatus, {[p.id]: nxt}), audit: this.log('Projectstatus: ' + st + ' → ' + nxt, 'Project ' + p.title)}) : () => {},
          match: () => this.setState({adminTab: 'matching', matchProj: p.id}),
          chain: PROJ_STATUSES.map((c, j) => ({label: c, style: 'padding:3px 9px;border-radius:2px;font-size:.72rem;font-weight:700;' + (j < i ? 'background:#DCFCE7;color:#166534' : j === i ? 'background:#0C1A2A;color:#fff' : 'background:#F2F3F5;color:#8A93A3')}))
        };
      }),
      matchProjOpts: ADMIN_PROJ.filter(p => ['Gepubliceerd', 'Matching'].includes(projStatus(p)) || p.id === s.matchProj).map(p => ({
        label: p.title, go: () => this.setState({matchProj: p.id}), style: this.chip(s.matchProj === p.id)
      })),
      matchProjTitle: mp.title + ' · ' + mp.meta,
      bestMatches: CANDIDATES.map((c, i) => {
        const key = mp.id + c.name, on = !!s.proposed[key];
        return {
          rank: (i + 1) + '.', name: c.name, initials: c.initials, score: c.score, reasons: c.reasons.slice(0, 3).join(' · '),
          avatar: 'width:36px;height:36px;border-radius:50%;background:' + c.color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0',
          btnLabel: on ? 'Voorgesteld' : 'Voorstellen',
          btnStyle: 'padding:9px 16px;border-radius:2px;border:none;font-weight:700;font-size:.83rem;cursor:pointer;' + (on ? 'background:#DCFCE7;color:#166534' : 'background:#0C1A2A;color:#fff'),
          propose: () => this.setState({proposed: Object.assign({}, s.proposed, {[key]: true}), audit: this.log('Kandidaat voorgesteld aan opdrachtgever', c.name + ' → ' + mp.title)})
        };
      }),
      auditLog: s.audit.concat(SEED_AUDIT)
    };
  }

  renderVals() {
    const s = this.state, screen = this.screen, pro = s.role === 'pro', phone = s.device === 'phone';
    const showReasons = this.props.showMatchReasons ?? true;

    const admin = s.role === 'admin';
    const navDefs = pro
      ? [['dash','Dashboard','Home'],['matches','Projecten','Werk'],['applications','Mijn aanmeldingen','Aanmeld.'],['profile','Mijn profiel','Profiel'],['notifications','Meldingen','Meldingen'],['settings','Instellingen','Meer'],['hd','Fase 2',''],['funnel','Mijn opdracht',''],['calendar','Beschikbaarheid',''],['map','Kaart',''],['chat','Berichten',''],['hours','Uren',''],['compliance','ZZP-check','']]
      : [['dash','Dashboard','Home'],['post','Project aanmelden','Aanmelden'],['matches','Voorgestelde kandidaten','Kandidaten'],['funnel','Opdracht','Opdracht'],['settings','Instellingen','Meer'],['hd','Fase 2',''],['map','Kaart',''],['chat','Berichten',''],['hours','Uren',''],['compliance','ZZP-check','']];
    const badges = {matches: pro ? (s.screening === 'Goedgekeurd' ? '3' : '') : '4', notifications: s.notifRead ? '' : '2', chat: '2'};

    const navItems = admin
      ? [['cands','Kandidaten','Kandidaten'],['projects','Projecten','Projecten'],['matching','Matching','Matching'],['audit','Auditlog','Audit']].map(([id, label, short]) => {
          const on = screen === 'admin' && s.adminTab === id;
          return {
            id, label, short, badge: '', badgeStyle: 'display:none',
            go: () => this.setState({screen: 'admin', adminTab: id}),
            style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;padding:11px 13px;border:none;border-radius:2px;cursor:pointer;font-size:.92rem;font-weight:' +
              (on ? '700;background:rgba(242,101,34,.16);color:#fff' : '600;background:none;color:rgba(255,255,255,.68)'),
            tabStyle: 'flex:1;padding:8px 2px;border:none;background:none;cursor:pointer;font-size:.72rem;font-weight:' + (on ? '800;color:#D4531A' : '600;color:#6B7280')
          };
        })
      : navDefs.map(([id, label, short]) => {
      const on = screen === id;
      if (id === 'hd') return {id, label, short, badge: '', badgeStyle: 'display:none', go: () => {},
        style: 'display:block;width:100%;text-align:left;padding:14px 13px 4px;border:none;background:none;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.4);cursor:default',
        tabStyle: 'display:none'};
      return {
        id, label, short, go: this.nav(id), badge: badges[id] || '',
        style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;padding:11px 13px;border:none;border-radius:2px;cursor:pointer;font-size:.92rem;font-weight:' +
          (on ? '700;background:rgba(242,101,34,.16);color:#fff' : '600;background:none;color:rgba(255,255,255,.68)'),
        badgeStyle: (badges[id] ? 'background:#F26522;color:#fff;border-radius:2px;padding:1px 8px;font-size:.72rem;font-weight:700' : 'display:none'),
        tabStyle: (short ? 'flex:1;padding:8px 2px;border:none;background:none;cursor:pointer;font-size:.72rem;font-weight:' + (on ? '800;color:#D4531A' : '600;color:#6B7280') : 'display:none')
      };
    });

    const titles = {
      dash: pro ? ['Dashboard', 'Vakman · Daan Verhoeven'] : ['Dashboard', 'Aannemer · Janssen Bouw B.V.'],
      post: ['Project aanmelden', 'Nieuwe aanvraag in 3 stappen'],
      matches: pro ? ['Projecten', 'Gesorteerd op match met je profiel'] : ['Voorgestelde kandidaten', 'Aftimmering 84 woningen — Almere Poort · voorgesteld door Timmerly'],
      applications: ['Mijn aanmeldingen', 'Status per project'],
      notifications: ['Meldingen', 'In-app en per e-mail'],
      settings: ['Instellingen', 'Account, beveiliging en privacy'],
      funnel: ['Opdracht', 'Aftimmering 84 woningen · Daan Verhoeven'],
      hours: pro ? ['Urenregistratie', 'Week 37 · Almere Poort'] : ['Uren goedkeuren', 'Week 37 · Daan Verhoeven'],
      profile: pro ? ['Mijn profiel', 'Zo zien aannemers je profiel'] : ['Profiel vakman', 'Daan Verhoeven · 96% match'],
      compliance: ['ZZP Compliance Check', 'Risicosignalering, geen juridisch advies'],
      chat: ['Berichten', pro ? 'Gesprekken met aannemers' : 'Gesprekken met kandidaten'],
      calendar: ['Beschikbaarheid', 'Kalender voor september'],
      map: ['Kaart', pro ? 'Projecten bij jou in de buurt' : 'Kandidaten op kaart'],
      admin: ['Beheer', 'Rol: Admin · volledige toegang']
    };
    const [pageTitle, pageSub] = titles[screen] || ['', ''];

    // ── Smart match lists
    const list = (pro ? PROJECTS : CANDIDATES).map((m, i) => ({
      name: m.title || m.name,
      initials: m.initials || '',
      meta: m.meta,
      score: m.score,
      rate: m.rate,
      badges: m.badges,
      reasons: showReasons ? m.reasons : [],
      avatar: pro ? 'display:none' : 'width:44px;height:44px;border-radius:50%;background:' + (m.color || NAVY) +
        ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;flex-shrink:0',
      barStyle: 'width:' + m.score + ';height:100%;background:#F26522',
      interest: () => this.setState({screen: 'funnel', stage: 1}),
      secondary: pro ? 'Bewaren' : 'Profiel bekijken',
      openProfile: () => this.setState({screen: pro ? 'matches' : 'profile'})
    }));

    const sw = CANDIDATES[Math.min(s.swipe, CANDIDATES.length - 1)];

    // ── Compliance
    const total = CF.reduce((sum, q) => sum + q.options[s.cf[q.id]][1], 0);
    const pct = Math.round((total / 12) * 100);
    const risk = total >= 9
      ? {label: 'Laag risico', bg: '#166534', explain: 'De samenwerking heeft overwegend kenmerken van zelfstandig ondernemerschap.'}
      : total >= 5
        ? {label: 'Aandacht vereist', bg: '#92400E', explain: 'Enkele kenmerken wijzen richting een arbeidsovereenkomst. Leg de afspraken scherper vast.'}
        : {label: 'Hoog risico', bg: '#991B1B', explain: 'Deze inzet lijkt sterk op werken in dienstverband. Bespreek een andere contractvorm.'};

    const signals = CF.map(q => {
      const v = q.options[s.cf[q.id]][1];
      return {
        text: v === 2 ? q.label + ': wijst op zelfstandigheid' : v === 1 ? q.label + ': aandachtspunt, leg vast in de overeenkomst' : q.label + ': risicofactor, ' + q.options[0][0].toLowerCase(),
        dot: 'width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-top:6px;background:' + (v === 2 ? GREEN : v === 1 ? AMBER : '#EF4444')
      };
    });

    const stage = FUNNEL[s.stage];
    const fields = [
      ['Projectnaam', s.parsed ? 'Aftimmering 84 woningen' : ''],
      ['Locatie', s.parsed ? 'Almere Poort' : ''],
      ['Aantal personen', s.parsed ? '4' : ''],
      ['Functie', s.parsed ? 'Allround timmerman' : ''],
      ['Startdatum', s.parsed ? '21 september 2026' : ''],
      ['Verwachte einddatum', s.parsed ? '12 december 2026' : ''],
      ['Uren per week', s.parsed ? '40' : ''],
      ['Werktijden', s.parsed ? '07:00 – 16:00' : ''],
      ['Vereiste ervaring', s.parsed ? 'Minimaal 3 jaar' : ''],
      ['Contractvorm', s.parsed ? 'ZZP of loondienst' : ''],
      ['Uurtarief indicatie', s.parsed ? '€45 – €50' : ''],
      ['Eigen vervoer vereist', s.parsed ? 'Ja' : '']
    ];

    return {
      ...this.extraVals(s, screen, pro, phone),
      isLanding: screen === 'landing',
      inApp: !['landing','projects','project','onboard'].includes(screen),
      isDesktop: !phone, isPhone: phone,
      isDashPro: screen === 'dash' && pro,
      isDashCon: screen === 'dash' && !pro,
      isPost: screen === 'post',
      isMatches: screen === 'matches',
      isFunnel: screen === 'funnel',
      isCompliance: screen === 'compliance',
      isProfile: screen === 'profile',
      isHours: screen === 'hours',
      isChat: screen === 'chat',
      isCalendar: screen === 'calendar',
      isMap: screen === 'map',
      isAdmin: screen === 'admin',
      profileCta: pro ? 'Profiel aanvullen' : 'Interesse tonen',
      profileBadges: [
        ['Identiteit geverifieerd', 1], ['ZZP geverifieerd', 1], ['VCA geverifieerd', 1],
        ['Top vakman', 0], ['Snel beschikbaar', 0], ['4.9 gemiddeld', 0]
      ].map(([label, v]) => ({
        label,
        style: 'padding:5px 12px;border-radius:2px;font-size:.78rem;font-weight:700;' +
          (v ? 'background:#DCFCE7;color:#166534' : 'background:#EDEFF2;color:#48546B')
      })),
      profileStats: [
        {label: 'Trust Score', value: 'Hoog', hint: 'verificaties, opkomst, reviews'},
        {label: 'Beoordeling', value: '4.9', hint: '23 reviews van aannemers'},
        {label: 'Afgerond', value: '17', hint: 'projecten via Timmerly'},
        {label: 'Reactietijd', value: '< 2 u', hint: 'gemiddeld op werkdagen'}
      ],
      specialisms: ['Aftimmering', 'Kozijnen en deuren', 'Woningbouw', 'Renovatie', 'Mutatiewerk'],
      certs: [
        {name: 'VCA Basis', meta: 'Geldig t/m 7 oktober 2026', status: 'Verloopt in 30 dagen', pill: 'padding:4px 11px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;background:#FEF3C7;color:#92400E'},
        {name: 'BHV', meta: 'Geldig t/m maart 2028', status: 'Geverifieerd', pill: 'padding:4px 11px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;background:#DCFCE7;color:#166534'},
        {name: 'Hoogwerker', meta: 'Ingediend 5 september', status: 'In behandeling', pill: 'padding:4px 11px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;background:#EDEFF2;color:#48546B'},
        {name: 'Steigerbouw basis', meta: 'Niet aangeleverd', status: 'Niet geverifieerd', pill: 'padding:4px 11px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;background:#fff;border:1px solid #DCE0E6;color:#8A93A3'}
      ],
      history: [
        {title: 'Nieuwbouw 120 woningen', meta: 'Bouwgroep Nagel · Zwolle · 8 maanden', work: 'Ruwbouw en aftimmering, team van 6'},
        {title: 'Aftimmering 46 appartementen', meta: 'Bouwgroep Nagel · Deventer · loopt sinds juni', work: 'Kozijnen, binnendeuren, plinten'},
        {title: 'Mutatieonderhoud 80 woningen', meta: 'Beter Wonen Onderhoud · Kampen · 5 maanden', work: 'Mutatiewerk en kleine renovaties'}
      ],
      reviews: [
        {who: 'Bouwgroep Nagel', score: '5,0', text: 'Draait zelfstandig mee, komt afspraken na en werkt veilig. Bij ons altijd welkom.', cats: ['Vakmanschap 5,0', 'Op tijd 5,0', 'Zelfstandig 5,0']},
        {who: 'Beter Wonen Onderhoud', score: '4,8', text: 'Nette oplevering en goede communicatie met de bewoners. Meldt problemen vroeg.', cats: ['Kwaliteit 5,0', 'Communicatie 4,5', 'Veilig werken 5,0']}
      ],
      weekTotal: '38,5',
      openHours: s.approved ? '0 uur' : '38,5 uur',
      weekDays: [
        ['Ma 7 sept', '07:00 – 16:00', '0,5 u', '8,0', 1],
        ['Di 8 sept', '07:00 – 16:30', '0,5 u', '8,5', 1],
        ['Wo 9 sept', '07:00 – 16:00', '0,5 u', '8,0', 1],
        ['Do 10 sept', '07:00 – 15:30', '0,5 u', '7,5', 1],
        ['Vr 11 sept', '07:00 – 14:00', '0,5 u', '6,5', 0]
      ].map(([day, time, pause, hours, ok]) => ({
        day, time, pause, hours,
        status: s.approved ? 'Goedgekeurd' : (ok ? 'Ingediend' : 'Concept'),
        pill: 'padding:4px 10px;border-radius:2px;font-size:.74rem;font-weight:700;text-align:center;' +
          (s.approved ? 'background:#DCFCE7;color:#166534' : ok ? 'background:#E8EDF7;color:#28405C' : 'background:#FEF3C7;color:#92400E')
      })),
      hoursCta: pro ? (s.approved ? 'Week is goedgekeurd' : 'Week indienen') : (s.approved ? 'Goedgekeurd' : 'Uren goedkeuren'),
      hoursSecondary: pro ? 'Dag toevoegen' : 'Afwijzen met reden',
      submitWeek: () => this.setState({approved: true}),
      shellStyle: phone
        ? 'max-width:420px;margin:24px auto;border:10px solid #0C1A2A;border-radius:34px;overflow:hidden;min-height:760px;background:#F2F3F5;box-shadow:0 24px 70px rgba(28,43,74,.28)'
        : 'min-height:100vh;background:#F2F3F5',

      goLanding: this.nav('landing'),
      goPro: () => this.setState({role: 'pro', screen: 'dash'}),
      goCon: () => this.setState({role: 'con', screen: 'dash'}),
      setPro: () => this.setState({role: 'pro', screen: 'dash'}),
      setCon: () => this.setState({role: 'con', screen: 'dash'}),
      setAdmin: () => this.setState({role: 'admin', screen: 'admin', adminTab: 'projects'}),
      rolePillPro: this.pill(pro), rolePillCon: this.pill(!pro && !admin), rolePillAdmin: this.pill(admin),
      toggleDevice: () => this.setState({device: phone ? 'desktop' : 'phone'}),
      goMatches: this.nav('matches'), goPost: this.nav('post'),
      goCompliance: this.nav('compliance'), goFunnel: this.nav('funnel'), goApplications: this.nav('applications'),

      navItems, pageTitle, pageSub,
      userName: admin ? 'S. Bakker' : pro ? this.proName() : 'Janssen Bouw',
      initials: admin ? 'SB' : pro ? this.proName().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'JB',
      avatarStyle: 'width:28px;height:28px;border-radius:50%;background:' + (admin ? '#3A5298' : pro ? ORANGE : NAVY) + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:.74rem;font-weight:700',

      trustPoints: ['Gescreende vakmensen','Geselecteerde projecten','Persoonlijk aanspreekpunt','Transparante afspraken','AVG-proof gegevensbeheer'],

      availOptions: ['Beschikbaar', 'Beperkt', 'Niet beschikbaar'].map(a => ({
        label: a, go: () => this.setState({avail: a}),
        style: 'padding:7px 13px;border-radius:2px;font-size:.8rem;font-weight:700;cursor:pointer;border:1px solid ' +
          (s.avail === a ? 'transparent;background:#22C55E;color:#0B3D22' : 'rgba(255,255,255,.22);background:none;color:rgba(255,255,255,.8)')
      })),

      projects: PROJECTS.map(p => ({
        title: p.title, meta: p.meta, score: p.score, rate: p.rate,
        scoreStyle: 'width:56px;flex-shrink:0;text-align:center;font-weight:700;font-size:1.05rem;color:' + DK,
        open: () => this.setState({screen: 'matches'})
      })),

      conStats: [
        {label: 'Openstaande projecten', value: '4', hint: '2 met tekort aan mensen'},
        {label: 'Nieuwe kandidaten', value: '11', hint: 'gem. score 89%'},
        {label: 'Reactiesnelheid', value: '3 u', hint: 'sneller dan 78% van bedrijven'},
        {label: 'Afgeronde opdrachten', value: '126', hint: 'beoordeling 4.8'}
      ],
      openProjects: (s.submitted ? [{title: 'Aftimmering 84 woningen — Almere Poort (nieuw)', meta: '4 personen · start 21 sept · ingediend zojuist', pill: 'In beoordeling', pillStyle: pillOf('In beoordeling')}] : []).concat([
        {title: 'Aftimmering 84 woningen — Almere Poort', meta: '4 personen · start 21 sept · 11 kandidaten', pill: '11 matches', pillStyle: 'background:rgba(242,101,34,.12);color:#D4531A;padding:4px 11px;border-radius:2px;font-size:.76rem;font-weight:700;white-space:nowrap'},
        {title: 'Mutatieonderhoud — Zwolle Zuid', meta: '2 personen · doorlopend · 3 kandidaten', pill: '3 matches', pillStyle: 'background:rgba(242,101,34,.12);color:#D4531A;padding:4px 11px;border-radius:2px;font-size:.76rem;font-weight:700;white-space:nowrap'},
        {title: 'Betonbouw parkeergarage — Utrecht', meta: '6 personen · start 5 okt · 0 kandidaten', pill: 'Tekort', pillStyle: 'background:#FEE2E2;color:#991B1B;padding:4px 11px;border-radius:2px;font-size:.76rem;font-weight:700;white-space:nowrap'},
        {title: 'Kozijnen renovatie — Deventer', meta: '1 persoon · start 14 sept · vervuld', pill: 'Vervuld', pillStyle: 'background:#DCFCE7;color:#166534;padding:4px 11px;border-radius:2px;font-size:.76rem;font-weight:700;white-space:nowrap'}
      ]),
      hours: [
        {name: 'Daan Verhoeven', meta: 'Week 36 · Almere Poort', total: '38,5 u', stateLabel: s.approved ? 'Goedgekeurd' : 'Open', state: 'padding:4px 10px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;' + (s.approved ? 'background:#DCFCE7;color:#166534' : 'background:#FEF3C7;color:#92400E')},
        {name: 'Youssef El Amrani', meta: 'Week 36 · Almere Poort', total: '40 u', stateLabel: s.approved ? 'Goedgekeurd' : 'Open', state: 'padding:4px 10px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;' + (s.approved ? 'background:#DCFCE7;color:#166534' : 'background:#FEF3C7;color:#92400E')},
        {name: 'Marijn de Wit', meta: 'Week 35 · Zwolle Zuid', total: '32 u', stateLabel: 'Goedgekeurd', state: 'padding:4px 10px;border-radius:2px;font-size:.75rem;font-weight:700;white-space:nowrap;background:#DCFCE7;color:#166534'}
      ],
      approveAll: () => this.setState({approved: true}),
      pool: CANDIDATES.map(c => ({
        name: c.name, initials: c.initials, status: c.name === 'Bram Sikkema' ? 'Niet beschikbaar' : 'Beschikbaar',
        avatar: 'width:36px;height:36px;border-radius:50%;background:' + c.color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0'
      })),

      postSteps: ['1. Beschrijving', '2. Gegevens', '3. Indienen'].map((l, i) => ({
        label: l,
        style: 'padding:8px 15px;border-radius:2px;font-size:.83rem;font-weight:700;' +
          (s.postStep === i + 1 ? 'background:#0C1A2A;color:#fff' : s.postStep > i + 1 ? 'background:#DCFCE7;color:#166534' : 'background:#fff;border:1px solid #DCE0E6;color:#6B7280')
      })),
      postStep1: s.postStep === 1, postStep2: s.postStep === 2, postStep3: s.postStep === 3,
      briefValue: s.brief,
      setBrief: e => this.setState({brief: e.target.value}),
      useExample: () => this.setState({brief: 'Ik zoek 4 timmermannen in Almere voor 12 weken, minimaal 3 jaar ervaring, start 21 september.'}),
      parseBrief: () => this.setState({parsed: true, postStep: 2}),
      nextPost: () => this.setState({postStep: Math.min(3, s.postStep + 1)}),
      prevPost: () => this.setState({postStep: Math.max(1, s.postStep - 1)}),
      publish: () => this.setState({screen: 'dash', submitted: true, postStep: 1}),
      parsedPill: s.parsed ? 'Automatisch ingevuld uit je beschrijving' : 'Handmatig invullen',
      parsedPillStyle: 'padding:4px 12px;border-radius:2px;font-size:.76rem;font-weight:700;' + (s.parsed ? 'background:#DCFCE7;color:#166534' : 'background:#F2F3F5;color:#6B7280'),
      postFields: fields.map(([label, value]) => ({
        label, value: value || 'Nog invullen',
        boxStyle: 'padding:12px 14px;border:2px solid ' + MID + ';border-radius:2px;font-size:.92rem;background:' + (value ? '#fff' : BG) + ';color:' + (value ? NAVY : TXT) + ';font-weight:' + (value ? '600' : '400')
      })),

      searchQuery: pro
        ? 'Werk binnen 40 km van Kampen, beschikbaar vanaf 14 september'
        : '4 timmermannen in Almere, min. 3 jaar ervaring, start volgende week',
      filters: (pro
        ? ['Binnen 40 km', 'Vanaf 14 sept', 'Aftimmering', 'ZZP', '€45+ p/u']
        : ['Allround timmerman', 'Almere · 50 km', 'VCA vereist', 'Min. 3 jaar', 'ZZP of loondienst']
      ).map((f, i) => ({
        label: f,
        style: 'padding:6px 13px;border-radius:2px;font-size:.8rem;font-weight:700;' +
          (i === 0 ? 'background:rgba(242,101,34,.12);color:#D4531A' : 'background:#F2F3F5;border:1px solid #DCE0E6;color:#6B7280')
      })),
      showSwipe: phone && !pro,
      showList: !(phone && !pro),
      matchList: list,
      interestLabel: pro ? 'Reageren op project' : 'Interesse tonen',
      swipeCard: {
        name: sw.name, initials: sw.initials, meta: sw.meta, score: sw.score, reasons: sw.reasons,
        avatar: 'width:48px;height:48px;border-radius:50%;background:' + sw.color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0',
        scoreStyle: 'font-weight:700;font-size:1.25rem;color:' + DK
      },
      swipeProgress: 'Kandidaat ' + (Math.min(s.swipe, CANDIDATES.length - 1) + 1) + ' van ' + CANDIDATES.length + ' · ' + s.liked + ' bewaard',
      swipeSkip: () => this.setState({swipe: (s.swipe + 1) % CANDIDATES.length}),
      swipeLike: () => this.setState({swipe: (s.swipe + 1) % CANDIDATES.length, liked: s.liked + 1, screen: 'funnel', stage: 1}),

      funnelChips: FUNNEL.map((f, i) => ({
        label: f.label,
        style: 'padding:7px 15px;border-radius:2px;font-size:.83rem;font-weight:700;' +
          (i === s.stage ? 'background:#F26522;color:#fff' : i < s.stage ? 'background:#DCFCE7;color:#166534' : 'background:#F2F3F5;border:1px solid #DCE0E6;color:#6B7280')
      })),
      stageTag: stage.tag, stageTitle: stage.title, stageBody: stage.body, stageCta: stage.cta,
      stagePoints: stage.points.map(([k, v]) => ({k, v})),
      advance: () => this.setState({stage: Math.min(FUNNEL.length - 1, s.stage + 1)}),
      resetFunnel: () => this.setState({stage: 0}),
      chat: [
        {who: 'Janssen Bouw', text: 'Hoi Daan, we starten 21 september met de aftimmering. Ben je dan vrij?', side: 0},
        {who: 'Daan Verhoeven', text: 'Ja, vanaf 14 september ben ik beschikbaar. Werktijden 07:00–16:00?', side: 1},
        {who: 'Janssen Bouw', text: 'Klopt. Voorstel volgt met tarief €47,50 en 40 uur per week.', side: 0}
      ].map(c => ({
        who: c.who, text: c.text,
        style: 'max-width:88%;padding:12px 14px;border-radius:2px;' + (c.side ? 'align-self:flex-end;background:#0C1A2A;color:#fff' : 'align-self:flex-start;background:#F2F3F5;border:1px solid #DCE0E6;color:#0C1A2A')
      })),

      cfQuestions: CF.map(q => ({
        label: q.label, help: q.help,
        options: q.options.map((o, i) => ({
          label: o[0], go: () => this.setState({cf: Object.assign({}, s.cf, {[q.id]: i})}),
          style: 'padding:9px 14px;border-radius:2px;font-size:.85rem;font-weight:700;cursor:pointer;border:2px solid ' +
            (s.cf[q.id] === i ? '#F26522;background:rgba(242,101,34,.08);color:#D4531A' : '#DCE0E6;background:#fff;color:#6B7280')
        }))
      })),
      riskLabel: risk.label, riskExplain: risk.explain,
      riskCardStyle: 'border-radius:2px;padding:22px;color:#fff;background:' + risk.bg,
      riskBarStyle: 'width:' + pct + '%;height:100%;background:#fff',
      signals,

      threads: CHAT_THREADS.map((t, i) => ({
        name: t.name, preview: (t.messages[t.messages.length - 1] || {}).text || '',
        go: () => this.setState({chatThread: i}),
        style: 'display:block;width:100%;text-align:left;padding:14px 16px;border:none;border-bottom:1px solid #EDEFF2;cursor:pointer;' +
          (s.chatThread === i ? 'background:#F2F3F5' : 'background:#fff')
      })),
      activeThread: (() => {
        const t = CHAT_THREADS[s.chatThread];
        const extra = s.chatMessages[s.chatThread] || [];
        return {
          name: t.name, project: t.project,
          messages: t.messages.concat(extra).map(m => ({
            who: m.who, text: m.text,
            style: 'max-width:88%;padding:12px 14px;border-radius:2px;display:flex;flex-direction:column;' +
              (m.side ? 'align-self:flex-end;background:#0C1A2A;color:#fff' : 'align-self:flex-start;background:#F2F3F5;border:1px solid #DCE0E6;color:#0C1A2A')
          }))
        };
      })(),
      chatDraft: s.chatDraft,
      setChatDraft: e => this.setState({chatDraft: e.target.value}),
      sendChat: () => {
        if (!s.chatDraft.trim()) return;
        const idx = s.chatThread;
        const extra = (s.chatMessages[idx] || []).concat([{who: pro ? (this.props.proName ?? 'Daan Verhoeven') : 'Janssen Bouw', text: s.chatDraft, side: 1}]);
        this.setState({chatMessages: Object.assign({}, s.chatMessages, {[idx]: extra}), chatDraft: ''});
      },

      calLegend: [['Beschikbaar', '#22C55E'], ['Beperkt', '#F59E0B'], ['Niet beschikbaar', '#EF4444'], ['Geboekt', NAVY]].map(([label, c]) => ({
        label, dot: 'display:inline-block;width:9px;height:9px;border-radius:50%;background:' + c
      })),
      calDays: (() => {
        const cells = [{blank: true}];
        for (let n = 1; n <= 30; n++) cells.push({n, booked: n >= 21});
        const colors = {Beschikbaar: ['#DCFCE7', '#166534'], Beperkt: ['#FEF3C7', '#92400E'], 'Niet beschikbaar': ['#FEE2E2', '#991B1B'], Geboekt: [NAVY, '#fff']};
        return cells.map(d => {
          if (d.blank) return {n: '', style: 'visibility:hidden'};
          const status = d.booked ? 'Geboekt' : (s.calendar[d.n] || 'Beschikbaar');
          const [bg, fg] = colors[status];
          return {
            n: d.n,
            go: d.booked ? () => {} : () => {
              const cur = s.calendar[d.n] || 'Beschikbaar';
              const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
              this.setState({calendar: Object.assign({}, s.calendar, {[d.n]: next})});
            },
            style: 'aspect-ratio:1;border-radius:2px;border:none;font-weight:700;font-size:.85rem;cursor:' + (d.booked ? 'default' : 'pointer') + ';background:' + bg + ';color:' + fg
          };
        });
      })(),

      mapListTitle: pro ? 'Projecten in de buurt' : 'Kandidaten op kaart',
      mapPins: (pro ? PROJECTS : CANDIDATES).map(m => {
        const [x, y] = m.coords || [50, 50];
        const name = m.title || m.name;
        const color = m.color || ORANGE;
        const go = () => this.setState({screen: pro ? 'matches' : 'profile'});
        return {
          name, meta: m.meta, go,
          short: (m.initials || name[0]),
          style: 'position:absolute;left:' + x + '%;top:' + y + '%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:' + color + ';color:#fff;font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center',
          cardStyle: 'display:block;width:100%;text-align:left;padding:14px;border:1px solid #DCE0E6;border-radius:2px;background:#fff;cursor:pointer'
        };
      }),

      _end: true
    };
  }
}

// Koppeling met assets/dc-runtime.js.
const DEFAULT_PROPS = {
  "startScreen": "landing",
  "showMatchReasons": true,
  "proName": "Daan Verhoeven",
  "forceOnboard": false
};

// Demo-props zijn via de URL te zetten, bijv. index.html?startScreen=admin
function propsFromUrl() {
  const params = new URLSearchParams(location.search);
  const props = Object.assign({}, DEFAULT_PROPS);
  for (const [key, value] of params) {
    if (!(key in DEFAULT_PROPS)) continue;
    props[key] = typeof DEFAULT_PROPS[key] === 'boolean' ? value !== 'false' : value;
  }
  return props;
}

DC.mount({ template: '#dc-template', mount: '#app', component: Component, props: propsFromUrl() });
