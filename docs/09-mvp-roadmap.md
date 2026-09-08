# 9. MVP-roadmap

## Fase 1 — MVP (gebouwd)

Alles hieronder staat in `main`, met tests, migraties en een productiebuild.

**Vakman** — registratie, e-mailverificatie, onboarding in vijf stappen,
profiel (vak, specialisaties, ervaring, bio, locatie, logistiek, contractvorm,
tarief, uren), zzp-gegevens met verificatieclaim, certificaten met
geldigheidsbewaking, beschikbaarheid (status + kalender), werkhistorie,
projecten zoeken met filters en matchscore, interesse tonen, gesprek,
voorstel accepteren, uren per dag en week indienen, opdrachtgever beoordelen,
opgeslagen projecten, ZZP-check, meldingen, instellingen (wachtwoord, 2FA,
sessies, voorkeuren, zichtbaarheid, export, verwijderen).

**Opdrachtgever** — registratie, bedrijfsprofiel met KvK-verificatieclaim,
project plaatsen vanuit één zin of sjabloon, publicatie (direct als
geverifieerd, anders via beoordeling), kandidatenoverzicht met score en
uitleg, Smart Match-suggesties en benaderen, gesprek, voorstel, opdracht
starten en afronden, uren goedkeuren of afwijzen met reden, vakman beoordelen,
vakmensen zoeken, talentpool, ZZP-signalering bij projecten, reputatie.

**Platform** — RBAC, auditlog, verificatiewachtrij, projectbeoordeling,
gebruikersbeheer, meldingen, reviewmoderatie, configuratie (gewichten,
regelset, flags), notificaties met digest-voorkeur, worker, health-endpoint,
security headers, rate limiting, SEO (sitemap, robots, plaatspagina's),
verdienmodel als data.

## Fase 2 — vertrouwen en gemak (volgende 2–3 maanden)

| Onderwerp | Wat | Raakt |
| --- | --- | --- |
| Documenten | Upload van certificaten, KvK-uittreksel en polissen naar objectopslag; typecontrole; malware-scan; presigned URLs | `certificates.documentKey`, nieuwe `documents`-tabel |
| Identiteit | iDIN of identity-provider; alleen uitkomst opslaan | `verifications.provider` |
| KvK en BTW | KvK Zoeken-API bij invoer en per kwartaal; VIES voor BTW | `verifications.evidence` |
| Telefoon | SMS-code | `one_time_tokens` purpose `verify_phone` |
| E-mail | Echte transport (Postmark/SES), templates, bounce-afhandeling | `lib/mail.ts` |
| Kaart | Projecten binnen X km / kandidaten op kaart met vergrofde locatie | `coarsen()`, PostGIS |
| Chat | Realtime (SSE of WebSocket), bijlagen, afspraak bevestigen als gestructureerd bericht | `messages.kind`, `attachments` |
| Fraude | Detectie van meerdere accounts, reviewpatronen, berichtsnelheid; risicoscore voeden | `users.riskScore` |
| Betalingen | Mollie voor bedrijfsabonnementen en uitgelichte projecten | `subscriptions`, `projects.featuredUntil` |
| Push | Web push, later app | `notification_preferences.push` |
| Analytics | Dashboard voor het team: conversie per stap, retentie, regio's, functies | queries op bestaande tabellen |
| AI | Projectomschrijving genereren, zoekintentie begrijpen, compliance-assistent — via dezelfde contracten (`ParsedBrief`, `screenProject`) | `ANTHROPIC_API_KEY` |

## Fase 3 — schaal en uitbreiding (6–12 maanden)

* Matches vooruit berekenen (event-gedreven `matches`-tabel), zoekindex,
  read replica, Redis voor rate limiting en sessies, BullMQ.
* Andere bouwberoepen activeren (metselaar, tegelzetter, …) met eigen
  specialismen en certificaten.
* Uitzendbureaus en payroll als derde rol (`workArrangement` en `plans` zijn
  erop voorbereid).
* Documentencentrum met opdrachtbevestigingen en urenstaten als PDF;
  facturatie op basis van goedgekeurde uren.
* België en Duitsland: taal (i18n-laag), adres- en bedrijfsregisters (KBO,
  Handelsregister), lokale compliance-regelsets naast de Nederlandse.
* Native app voor vakmensen (dezelfde server actions achter een API).

## Meetlat per feature

Elke nieuwe feature beantwoordt de zeven vragen uit de opdracht: waardevoller,
veiliger, betere matching, eenvoudiger, schaalbaar, juridisch en
privacy-technisch verantwoord, uitbreidbaar. Een feature die op "veiliger" of
"verantwoord" niet overtuigend ja scoort, wacht.
