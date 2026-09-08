# Timmerly — klikbaar prototype v2

Klikbaar prototype (referentie-UX) van het Timmerly-platform: een matchingplatform voor
zzp-timmermannen en aannemers. De site is een directe port van het Claude
Design-project *Timmerly Prototype v2* en draait zonder build of framework —
open `index.html` in een browser of zet de map op een statische host.

## Structuur

| Pad | Wat |
| --- | --- |
| `index.html` | De app: 19 schermen in één single-page prototype |
| `assets/dc-runtime.js` | Mini-runtime voor de templatetaal van het ontwerp |
| `assets/app.js` | Schermlogica en demodata, uit de ontwerpbron |
| `*.html` (overig) | Inhoudelijke pagina's: over, hoe het werkt, voorwaarden, privacy |
| `design/` | De ontwerpbronnen uit Claude Design (`.dc.html`) |
| `tools/build.js` | Genereert de site uit `design/` |

## Schermen

De app kent drie rollen, om te wisselen via het demopaneel linksonder:

- **Publiek** — homepage, projectoverzicht met filters, projectdetail en een
  aanmelding in negen stappen.
- **Vakman** — dashboard met screeningstatus, projecten, mijn aanmeldingen,
  profiel, meldingen, instellingen, urenregistratie, beschikbaarheidskalender,
  berichten, kaart en de ZZP-check.
- **Aannemer** — dashboard, project aanmelden, voorgestelde kandidaten, de
  opdrachtfunnel van match tot review, en uren goedkeuren.
- **Admin** — kandidaten screenen, projecten door de statusketen halen,
  matching en een auditlog dat wijzigingen vastlegt.

`Mobiele weergave` in hetzelfde paneel zet de app in een telefoonframe.

Een scherm is ook direct te openen via de URL, bijvoorbeeld
`index.html?startScreen=admin`. Verder werken `proName`, `showMatchReasons` en
`forceOnboard` als query-parameter.

## Wijzigen

De HTML in de root en `assets/app.js` worden **gegenereerd**. Pas het ontwerp
aan in Claude Design, vervang de bestanden in `design/` en draai:

```sh
node tools/build.js
```

Alleen `assets/dc-runtime.js` en `tools/build.js` zijn met de hand geschreven.

## Over de data

Alle namen, tarieven, projecten en beoordelingen zijn fictief; de app bewaart
niets tussen sessies. De ZZP-check is risicosignalering en geen juridisch
advies.
