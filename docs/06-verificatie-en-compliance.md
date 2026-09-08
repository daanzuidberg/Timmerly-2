# 6. Verificatie- en compliance-architectuur

## Verificatie

Elke controle is een aparte claim met een eigen bewijs en status
(`unverified` → `pending` → `verified` | `rejected` | `expired`).

| Claim | Hoe nu | Hoe in fase 2 |
| --- | --- | --- |
| E-mail | Eenmalige link, 24 uur geldig | idem |
| Telefoon | Veld aanwezig; verificatie handmatig | SMS-code |
| Identiteit | Claim ontstaat bij afronden onboarding; team beoordeelt | iDIN of een identity-provider (Onfido/Veriff); wij bewaren alleen de uitkomst |
| Bedrijf | KvK-nummer, naam en vestiging; team controleert | KvK Zoeken-API, automatisch bij invoer, herhaald per kwartaal |
| ZZP-status | KvK, BTW-nummer (formaatcontrole), verzekering; team controleert | KvK-API + VIES voor BTW; verzekeringspolis als document |
| Certificaten | Type, nummer, geldigheid; team controleert | Upload met malware-scan; Centraal Diploma Register VCA-controle waar beschikbaar |

**Badges worden afgeleid, nooit gezet.** `Identiteit geverifieerd`, `ZZP
geverifieerd`, `VCA geverifieerd`, `Top vakman` (trustscore ≥ 80), `Snel
beschikbaar` en de beoordeling komen rechtstreeks uit `verifications`,
`certificates`, `trustScore` en `reviews`.

**Geldigheid wordt bewaakt.** De worker markeert verlopen certificaten als
`expired` en stuurt 30 dagen vooraf één waarschuwing (`expiryWarnedAt`).
Verlopen certificaten tellen in de matching als ontbrekend.

**Wat "ZZP geverifieerd" betekent** staat letterlijk in de UI en de
voorwaarden: de ondernemingsgegevens kloppen. Het is geen uitspraak over de
kwalificatie van een specifieke arbeidsrelatie.

## ZZP-check (Wet DBA)

`packages/compliance` bevat een **versiebeheerde regelset**
(`RULESET_2026_09`) met negen factoren die de Belastingdienst en de Hoge Raad
meewegen: gezag, inbedding, vervanging, gereedschap, ondernemersrisico,
meerdere opdrachtgevers, duur, betaling en contractafspraken. Gezag en
inbedding wegen dubbel, in lijn met de holistische weging uit het
Deliveroo-arrest en het wetsvoorstel Vbar.

* Elke optie scoort 0 (dienstverband), 1 (grensgeval) of 2 (zelfstandig).
* Uitkomst: percentage van de maximale score → `low` (≥ 70 %), `attention`
  (≥ 40 %), `high`; een zware factor op 0 tilt "laag" altijd naar "aandacht".
* Onbeantwoorde vragen tellen als grensgeval en maken de uitkomst expliciet
  **voorlopig** — een half ingevulde check kan nooit "laag risico" geven.
* De uitkomst bevat signalen per factor, de regelsetversie, bronnen en de
  disclaimer. Ingelogde gebruikers krijgen hem opgeslagen in
  `compliance_checks` met antwoorden en versie, zodat een latere wetswijziging
  oude uitkomsten niet verandert.
* `screenProject()` geeft opdrachtgevers en het team bij een project directe
  signalen (geen einddatum, > 12 maanden fulltime, gereedschap van de
  opdrachtgever, vacaturetaal, aansturing in de omschrijving).

**Presentatie.** Overal: "risicosignalering, geen juridisch advies; partijen
blijven zelf verantwoordelijk voor de kwalificatie". Dat staat in de check, in
de projectwaarschuwing, in de voorwaarden en in de footer.

**Wijzigen bij nieuwe wetgeving.** Een nieuwe regelset is een nieuw object in
`ruleset.ts` met eigen versie en `effectiveFrom`; activeren gebeurt in
`/admin/instellingen` (`compliance.rulesetVersion`). Geen herbouw, en bestaande
dossiers behouden hun versie.

## AVG / privacy-by-design

| Recht of principe | Waar |
| --- | --- |
| Toestemming voorwaarden en privacybeleid | `termsAcceptedAt` bij registratie |
| Inzage en overdraagbaarheid | `exportMyData()` — volledig JSON-bestand, zonder wachtwoordhash en 2FA-geheim |
| Verwijdering | `deleteMyAccount()` — anonimiseert direct; bewaarplicht voor opdracht-, uren- en reviewgegevens zonder identificerende velden |
| Correctie | Alle profielvelden zijn zelf te bewerken |
| Eigen regie over zichtbaarheid | `visibility` (vindbaar, woonplaats, tarief) |
| Dataminimalisatie | Geen documenten of ID-kopieën in de database; alleen uitkomst en referentie |
| Bewaartermijnen | Zie [datamodel](03-datamodel.md); opschoning door de worker |
| Logging | Auditlog en beveiligingslog met bewaartermijn |
| Verwerkers | EU-hosting, e-mail, identity-provider — met verwerkersovereenkomst (organisatorisch) |
| Cookies | Alleen de functionele sessiecookie; geen tracking; cookiebanner niet nodig zolang dat zo blijft |

Digitaledienstenverordening (DSA): meldingsmechanisme voor gebruikers, motivering
bij verwijdering (`reviewNote`, `resolution`) en een auditspoor zijn aanwezig.
