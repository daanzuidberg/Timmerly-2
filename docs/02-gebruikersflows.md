# 2. Gebruikersflows

Regel voor elke flow: de gebruiker mag nooit denken "waar moet ik klikken?".
Elke primaire actie is bereikbaar vanuit het dashboard en vanuit de plek waar
hij logisch is (een project, een gesprek, een profiel).

## Vakman

```
Registreren ("Ik zoek werk")            /registreren?rol=professional
  → e-mailbevestiging (link, 24 u)      /verifieer/[token]
  → onboarding in 5 stappen             /onboarding?stap=1..5
      1 vakervaring  2 persoonlijk (+2b onderneming bij zzp)  3 certificaten  4 beschikbaarheid  5 verificatie
  → dashboard                           /dashboard
      beschikbaarheid · top-3 matches · aanmeldingen · profiel-compleetheid · certificaten
  → projecten zoeken                    /projecten (filters, gesorteerd op match)
  → projectdetail met uitleg score      /projecten/[id]
  → interesse (1 klik)                  showInterest()
  → gesprek                             /berichten/[aanmelding]
  → voorstel accepteren / vragen        StageActions
  → opdracht loopt: uren per dag        /uren/[aanmelding]
  → week indienen → goedkeuring
  → afgerond → opdrachtgever beoordelen /beoordelen/[aanmelding]
```

Zijpaden: beschikbaarheidskalender (`/profiel/beschikbaarheid`), certificaten
beheren, ZZP-gegevens, opgeslagen projecten, ZZP-check, instellingen
(wachtwoord, 2FA, sessies, meldingen, zichtbaarheid, export, verwijderen).

## Opdrachtgever

```
Registreren ("Ik zoek vakmensen")       /registreren?rol=company
  → bedrijfsprofiel (KvK)               /bedrijf   → verificatieclaim 'company'
  → dashboard                           /dashboard (open projecten, nieuwe kandidaten, uren te keuren)
  → project plaatsen                    /projecten/nieuw
      stap 1  één zin → parseBrief() vult velden
      stap 2  gegevens, eisen, tarief  (of sjabloon)
      stap 3  controleren op /mijn-projecten/[id]  → publiceren (geverifieerd) of indienen
  → kandidaten                          /mijn-projecten/[id]
      links: aanmeldingen met score en redenen · rechts: Smart Match-suggesties → "Benaderen"
  → gesprek openen → voorstel sturen    ProposalForm
  → opdracht starten na akkoord
  → uren goedkeuren / afwijzen met reden /uren/[aanmelding]
  → opdracht afronden → vakman beoordelen
```

Zijpaden: vakmensen zoeken (`/vakmensen`, met filters op certificaat,
ervaring, afstand, beschikbaar vanaf), talentpool (`/favorieten`), ZZP-check
en de ZZP-signalering bij een project.

## Timmerly-team

```
/admin                overzicht: gebruikers, projecten, conversieratio's, werkvoorraad
/admin/verificaties   identiteit, bedrijf, zzp en certificaten — verifiëren of afkeuren met toelichting
/admin/projecten      projecten in beoordeling, met ZZP-signalen; publiceren, terugsturen, verwijderen
/admin/gebruikers     zoeken, blokkeren (trekt sessies in), risicoscore
/admin/meldingen      open meldingen afhandelen; afgehandelde meldingen verlagen de trustscore van de gemelde
/admin/reviews        verbergen met reden
/admin/auditlog       alles wat hierboven gebeurt, doorzoekbaar
/admin/instellingen   matchinggewichten, actieve regelset, feature flags
```

## Wie mag wat in de funnel

Vastgelegd in `TRANSITIONS` (`actions/applications.ts`):

| Van | Naar | Door |
| --- | --- | --- |
| interesse | contact / niet geselecteerd | bedrijf |
| interesse, contact, voorstel, akkoord | ingetrokken | vakman |
| contact | voorstel | bedrijf (via voorstelformulier) |
| voorstel | akkoord / terug naar contact | vakman |
| akkoord | opdracht loopt | bedrijf |
| opdracht loopt | afgerond | bedrijf |
| afgerond | beoordeeld | automatisch zodra beide reviews binnen zijn |

Elke stap stuurt de wederpartij een melding en schrijft een auditregel.

## Publiek (zonder account)

Landingspagina, projectoverzicht met filters, projectdetail (score zichtbaar
na inloggen), hoe het werkt, voor opdrachtgevers, ZZP-check, prijzen, over,
privacy, voorwaarden, support, verificatie, en per plaats
`/timmerman-gezocht/[plaats]` met actuele projecten binnen 40 km.
