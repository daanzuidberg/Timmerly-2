# 1. Productarchitectuur

## Kernprincipe

> De juiste vakman op het juiste project, op het juiste moment.

Alles in Timmerly staat in dienst van drie dingen: **matching** die uitlegbaar
is, **vertrouwen** dat op echte controles berust, en een **gebruikerservaring**
waarin elke belangrijke actie hooguit een paar klikken kost.

Timmerly is geen vacaturebank. Een vacaturebank publiceert en wacht; Timmerly
scoort, rangschikt en legt uit — in beide richtingen.

## Doelgroepen

| Rol in de code | Wie | Wat ze komen doen |
| --- | --- | --- |
| `professional` | Timmermannen (allround, beton, mutatie, werkplaats, voorman), zzp of loondienst | Passend werk vinden, één profiel bijhouden, afspraken en uren op één plek |
| `company` | Aannemers, bouwbedrijven, onderaannemers, projectontwikkelaars | Binnen minuten gescreende vakmensen vinden, projecten plaatsen, talentpool opbouwen |
| `admin` / `moderator` | Timmerly-team | Verifiëren, modereren, meldingen afhandelen, configuratie beheren |

Beroepen zijn **data**, geen code: de tabel `trades` bevat nu al metselaar,
tegelzetter, loodgieter, elektricien, schilder, stukadoor, sloper, grondwerker,
uitvoerder en werkvoorbereider met `active = false`. Uitbreiden naar een nieuw
beroep is een rij activeren plus specialismen toevoegen in `@timmerly/core`.

## Modules

Het platform is opgebouwd uit modules die elk één verantwoordelijkheid hebben.
De tabel geeft per module de plek in de code en de status.

| Module | Verantwoordelijkheid | Waar | Status |
| --- | --- | --- | --- |
| Accounts & sessies | Registratie, login, 2FA, sessiebeheer, wachtwoordherstel | `apps/web/src/lib/auth`, `packages/auth` | MVP |
| Profielen | Vakman- en bedrijfsprofiel, onboarding, zichtbaarheid | `apps/web/src/lib/actions/profile.ts` | MVP |
| Verificatie | Claims per soort (e-mail, telefoon, identiteit, bedrijf, zzp, certificaat) met status en bewijs | tabel `verifications`, `certificates`, admin-wachtrij | MVP (handmatig), providers fase 2 |
| Projecten | Plaatsen (in één zin → formulier), sjablonen, beoordeling, statusketen | `actions/projects.ts`, `lib/brief.ts` | MVP |
| Matching | Score 0–100 met redenen, beide richtingen, gewichten uit config | `packages/matching`, `apps/web/src/lib/matching.ts` | MVP |
| Funnel | interesse → contact → voorstel → akkoord → opdracht → afgerond → review | `actions/applications.ts` (`TRANSITIONS`) | MVP |
| Berichten | Gesprek per aanmelding, systeemberichten voor voorstellen | tabellen `conversations`, `messages` | MVP (polling) |
| Uren | Dagregels, weekstaten, indienen, goedkeuren/afwijzen met reden | tabellen `timesheets`, `timesheet_entries` | MVP |
| Reviews | Twee richtingen, 7 categorieën, moderatie | tabel `reviews` | MVP |
| Compliance | ZZP-check als versiebeheerde regelset, projectscreening | `packages/compliance` | MVP |
| Vertrouwen | Interne trustscore, fraude-risicoscore, meldingen, blokkeren | `refreshTrustScore`, tabellen `reports`, `blocks` | MVP (score), detectie fase 2 |
| Notificaties | In-app, e-mail via jobqueue, digest-voorkeur | `lib/notify.ts`, `worker.ts` | MVP |
| Beheer | Verificatiewachtrij, projectbeoordeling, gebruikers, meldingen, reviews, auditlog, configuratie | `app/(app)/admin` | MVP |
| Verdienmodel | Plannen en abonnementen als data | tabellen `plans`, `subscriptions` | Datamodel; betaling fase 2 |
| SEO | Sitemap, robots, landingspagina's per plaats met echte projecten | `app/sitemap.ts`, `timmerman-gezocht/[plaats]` | MVP |

## Wat de MVP wél en niet doet

**Wel** — alles wat nodig is om de kernlus te draaien: profiel → verificatie →
match → interesse → gesprek → voorstel → akkoord → uren → review, voor beide
rollen, met een werkend team-portaal en auditlog.

**Nog niet** — documentupload met malware-scan, koppeling met een
identiteitsverificatiepartij en de KvK-API, betalingen, pushnotificaties,
kaartweergave, en realtime chat. Zie de [roadmap](09-mvp-roadmap.md); het
datamodel houdt er al rekening mee (`documentKey`, `provider`, `subscriptions`,
`attachments`, coördinaten).
