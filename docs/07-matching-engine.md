# 7. Matching-engine

`packages/matching` is een pure TypeScript-module zonder database. Ze kent
twee objecten — `ProfessionalFacts` en `ProjectFacts` — en één kernfunctie:

```ts
scoreMatch(pro, project, { weights?, today? }) → { score, eligible, distanceKm, reasons[] }
rankProfessionals(project, pros)   // voor Smart Match bij een project
rankProjects(pro, projects)        // voor het projectoverzicht van een vakman
```

Dezelfde functie beantwoordt beide vragen; er zijn geen twee algoritmes die
uit elkaar kunnen lopen.

## Laag 1 — poortwachters

Harde uitsluiting, score 0, met reden:

* ander vakgebied (met een kleine familie: timmerman ↔ allround ↔ voorman);
* afstand groter dan de reisafstand van de vakman;
* geen overlap in contractvorm (zzp / loondienst / beide);
* vakman staat op "niet beschikbaar".

## Laag 2 — gewogen criteria

Elk criterium levert een ratio 0..1 op, vermenigvuldigd met zijn gewicht. De
som van de gewichten is 100; de standaardwaarden staan in `DEFAULT_WEIGHTS` en
zijn via `settings.matching.weights` zonder release aan te passen.

| Criterium | Gewicht | Wat telt |
| --- | --- | --- |
| Specialisatie | 20 | Overlap tussen gevraagd werk en profiel |
| Ervaring | 14 | Jaren t.o.v. het minimum, met bonus daarboven |
| Afstand | 16 | ≤ 15 km vol, aflopend tot 25 % boven 80 km |
| Certificaten | 12 | Geverifieerd = 1, opgegeven maar niet geverifieerd = 0,6, verlopen = 0; VCA VOL dekt VCA Basis |
| Beschikbaarheid | 14 | Beschikbaar vóór de start = vol; tot 14 dagen erna 0,7; later 0,2; "beperkt" 0,5 |
| Tarief | 8 | Binnen de indicatie = vol; tot 10 % erboven 0,5; anders 0,1; onbekend 0,7 |
| Logistiek | 6 | Eigen vervoer, gereedschap en rijbewijs waar vereist |
| Reputatie | 6 | Trustscore, gemiddelde review, aantal afgeronde projecten |
| Uren | 4 | Gewenste uren t.o.v. gevraagde uren |
| Talentpool | +3 | Eerder ingezet door dit bedrijf |

## Uitleg is geen bijproduct

Elke bijdrage produceert een `MatchReason { key, label, positive, points }`.
Positieve redenen komen eerst, gesorteerd op gewicht; de UI toont de top 6.
De redenen worden bij interesse bevroren in `applications.matchReasons`, zodat
een gebruiker later nog ziet waarom hij paste én zodat we het algoritme kunnen
evalueren tegen de uitkomst van de funnel.

## Van database naar feiten

`apps/web/src/lib/matching.ts` vertaalt rijen naar feiten en voegt toe wat in
de engine geen query mag zijn: geverifieerde certificaten, gemiddelde review,
afgeronde projecten en de bedrijven waarvoor de vakman eerder werkte. Kandidaten
voor een project zijn alleen actieve, vindbare profielen met afgeronde
onboarding.

## Smart Match in taal

Een opdrachtgever typt "Ik heb vanaf volgende week 3 timmermannen nodig in
Zwolle, minimaal 3 jaar ervaring". `lib/brief.ts` haalt aantal, plaats, start,
duur, ervaring, uren, specialismen en contractvorm eruit en vult het formulier.
Regelgebaseerd en daardoor voorspelbaar; een taalmodel kan hetzelfde contract
(`ParsedBrief`) invullen als de kwaliteit dat rechtvaardigt.

## Notificatiestrategie

Bij publicatie krijgen hooguit tien kandidaten met een score ≥ 75 een
`match_found`-melding. E-mail volgt de voorkeur van de gebruiker (direct,
dagelijks, wekelijks, uit); de worker bundelt digests. Kwaliteit boven
kwantiteit is dus afgedwongen, niet alleen beloofd.

## Testen en evalueren

`packages/matching/src/engine.test.ts` dekt de poortwachters, elk criterium,
verlopen en niet-geverifieerde certificaten, VCA VOL → Basis, gewichten,
grenzen en de rangschikking in beide richtingen.

Voor de volgende stap — gewichten bijstellen op basis van uitkomsten — zijn
de ingrediënten aanwezig: bevroren score en redenen per aanmelding, de
funnelfase, en de reviewscores na afloop. Een wekelijkse rapportage "score bij
interesse" tegen "kwam tot contact / akkoord / goede review" is de eerste
feedbacklus; A/B op gewichten kan via `settings` zonder deploy.
