# 8. UX/UI-structuur

## Principes

1. **Binnen seconden begrijpelijk.** Eén primaire actie per scherm, in oranje.
   Al het andere is wit of donkerblauw.
2. **Uitleg bij elke score.** Nooit een percentage zonder redenen.
3. **Statussen zijn woorden, met kleur als ondersteuning.** Groen = klaar,
   amber = wacht op iemand, rood = probleem, blauw = informatie.
4. **Weinig tekst, sterke typografie.** Titels vertellen wat er staat;
   secundaire informatie in grijs.
5. **Werkt zonder JavaScript.** Formulieren zijn server actions; filters zijn
   GET-formulieren (deelbaar, cachebaar). Client-componenten voegen alleen
   comfort toe (chips, focusbehoud, polling).
6. **Mobile-first voor de vakman.** Grote knoppen, onderste tabbalk met de
   vijf belangrijkste bestemmingen, chat en uren op één duim afstand.

## Huisstijl

| Token | Waarde | Gebruik |
| --- | --- | --- |
| `navy` | `#0C1A2A` | Zijbalk, hero, primaire tekst, donkere knoppen |
| `orange` | `#F26522` | De ene primaire actie, actieve staat, accenten |
| `orange-700` | `#D4531A` | Links, hover |
| `ground` | `#F2F3F5` | Paginagrond, secundaire vlakken |
| `line` | `#DCE0E6` | Randen |
| `muted` / `faint` | `#6B7280` / `#8A93A3` | Secundaire tekst, labels |
| `ok`, `warn`, `bad` | groen, amber, rood | Statussen |
| radius | 4–6 px | Rustig, professioneel, geen speelse rondingen |
| font | Segoe UI / system-ui | Snel, vertrouwd, geen webfonts nodig |

De tokens staan in `apps/web/src/app/globals.css` (`@theme`); componenten
gebruiken utility-klassen `.btn-primary`, `.card`, `.pill`, `.chip`, `.input`,
`.label`, `.eyebrow`.

## Navigatie

| Rol | Zijbalk (desktop) | Tabbalk (mobiel) |
| --- | --- | --- |
| Vakman | Dashboard · Projecten · Mijn aanmeldingen · Berichten · Uren · Mijn profiel · Beschikbaarheid · ZZP-check · Opgeslagen | Home · Werk · Aanmeld. · Chat · Uren |
| Opdrachtgever | Dashboard · Mijn projecten · Project plaatsen · Vakmensen zoeken · Berichten · Uren goedkeuren · Talentpool · Bedrijfsprofiel · ZZP-check | Home · Projecten · Nieuw · Zoeken · Chat |
| Team | Overzicht · Verificaties · Projecten · Gebruikers · Meldingen · Reviews · Auditlog · Instellingen | — |

De kop van elke pagina toont titel, context en de belangrijkste actie
(bijv. "Project plaatsen" op het dashboard van een opdrachtgever). Meldingen en
account staan altijd rechtsboven.

## Schermen en componenten

| Scherm | Kerncomponenten |
| --- | --- |
| Landingspagina | Hero met voorbeeldmatch, trustbalk, vier stappen, actuele projecten, waarom, CTA voor opdrachtgevers |
| Projectoverzicht | `ProjectFilters` (GET), `ProjectCard` met score en afstand |
| Projectdetail | Score + `Reasons`, feiten-tabel, `InterestButton` (sticky) |
| Onboarding | Voortgangsbalk 1/5, één sectie van `ProfessionalProfileForm` per stap, `ChipGroup` voor meerkeuze |
| Dashboard vakman | Beschikbaarheid, top-3 matches, aanmeldingen, profiel-compleetheid met tips, certificaten |
| Dashboard opdrachtgever | Vier `Stat`-tegels, projectenlijst met kandidaten en status |
| Project plaatsen | Één-zin-invoer → `ProjectForm` (drie secties), sjabloonkeuze |
| Kandidaten | Aanmeldingen met `Score`, `Reasons`, `StageActions`, `ProposalForm`; Smart Match met `InviteButton` |
| Gesprek | `ChatBox` (10 s polling), projectkaart, voorstel, volgende stap |
| Uren | Weekstaten met dagregels; `EntryForm`, `SubmitWeekButton`, `DecideWeek` |
| ZZP-check | `ComplianceCheck`: vragen als chips, sticky uitkomstkaart, signalen, disclaimer |
| Instellingen | Wachtwoord, `TotpSetup`, `SessionList`, meldingen, zichtbaarheid, `PrivacyTools` |
| Beheer | Wachtrijen met `Decide`-patroon (toelichting verplicht bij afkeuren) |

## Onboarding en profiel-compleetheid

Vijf stappen, elk één scherm, met "Later afmaken" altijd zichtbaar.
`computeCompleteness()` telt dertien concrete punten (specialisaties, bio,
locatie, certificaten, geverifieerd certificaat, werkhistorie, telefoon,
e-mail, zzp-gegevens, beschikbaarheid …) en het dashboard toont de drie
aanbevelingen met het grootste effect.

## Toegankelijkheid

Labels op alle velden, `aria-pressed` op chips, `role="alert"` op fouten,
`aria-busy` tijdens acties, focusstijlen op invoervelden, kleur nooit als
enige drager van betekenis, `lang="nl"`.

## Prototype als referentie

`prototype/` bevat het klikbare ontwerp waaruit deze structuur komt. Het is de
plek om nieuwe schermen te schetsen voordat ze in de app worden gebouwd.
