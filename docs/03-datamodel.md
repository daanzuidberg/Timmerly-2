# 3. Datamodel

PostgreSQL 16, beheerd met Drizzle (`packages/db/src/schema`). Migraties staan
in `packages/db/migrations`; `pnpm db:migrate` is idempotent. Alle tabellen
hebben UUID-sleutels en `created_at`/`updated_at`.

## Overzicht

```
users ──1:1── professional_profiles ──1:n── certificates
  │                    │                    availability_days
  │                    │                    work_history
  │                    └──1:n── applications ──1:1── conversations ──1:n── messages
  │                                 │             ──1:n── timesheets ──1:n── timesheet_entries
  │                                 │             ──1:n── reviews
  │                                 └── n:1 ── projects ──n:1── company_profiles ──1:1── users
  ├──1:n── sessions, one_time_tokens, security_events
  ├──1:n── verifications, notifications, notification_preferences
  ├──1:n── favorites, saved_projects, reports, blocks, subscriptions, compliance_checks
  └── audit_log (actor), jobs, plans, settings, trades
```

## Ontwerpkeuzes

**Account ≠ profiel.** `users` bevat alleen wat voor authenticatie en RBAC
nodig is. Een vakman heeft een `professional_profile`, een bedrijf een
`company_profile`. Zo kan een gebruiker later een tweede rol krijgen zonder
migratie en blijft gevoelige informatie gescheiden.

**Verificatie als claims.** Elke controle is een rij in `verifications`
(`kind`, `status`, `provider`, `evidence`, `reviewedBy`). Certificaten hebben
een eigen tabel omdat ze een geldigheidsdatum en een documentverwijzing
hebben. Badges in de UI worden afgeleid van deze rijen — nooit uit een vrij
veld dat een gebruiker zelf kan zetten.

**Eén rij per (project, vakman).** `applications` is de funnel: `stage` loopt
van `interest` tot `reviewed`, `initiatedBy` legt vast wie begon, `matchScore`
en `matchReasons` bevriezen de score op het moment van interesse (voor de
gebruiker én voor evaluatie van het algoritme), `proposal` bewaart tarief,
looptijd en contractvorm. Gesprek, uren en reviews hangen aan deze rij, zodat
informatie nooit los in een chat zweeft.

**Locatieprivacy.** Profielen bewaren exacte coördinaten (`lat`, `lng`) alleen
voor afstandsberekening op de server. De UI toont hooguit de woonplaats;
`@timmerly/core` heeft `coarsen()` voor een toekomstige kaartweergave.

**Append-only auditlog.** `audit_log` krijgt geen updates of deletes. Elke
admin-actie, elke funnelstap, elke verificatiebeslissing, elke export of
verwijdering van een account staat erin, met `before`/`after`.

**Configuratie als data.** `settings` bevat matchinggewichten, de actieve
regelsetversie en feature flags; `plans` de abonnementen; `trades` de
beroepen. Aanpassen is een admin-actie, geen release.

**Achtergrondwerk in de database.** `jobs` is een eenvoudige wachtrij
(`run_at`, `attempts`, `locked_at`). Bij groei vervangt Redis/BullMQ dit
zonder domeinwijziging.

## Bewaarbeleid en verwijdering

| Gegeven | Termijn | Reden |
| --- | --- | --- |
| Account en profiel | zolang het account bestaat | uitvoering overeenkomst |
| Sessies, tokens | tot verloopdatum; opgeruimd door de worker | beveiliging |
| Beveiligingsgebeurtenissen | 12 maanden | fraudeonderzoek, loginmeldingen |
| Opdrachten, uren, reviews | 7 jaar, geanonimiseerd na accountverwijdering | fiscale bewaarplicht, verdedigingsbelang wederpartij |
| Auditlog | 7 jaar | verantwoording |

Accountverwijdering (`deleteMyAccount`) anonimiseert het `users`-record (e-mail,
naam, telefoon, wachtwoord, 2FA), wist bio, locatie en zzp-gegevens uit het
profiel, verwijdert sessies en meldingen en zet `status = deleted`. Verwijzingen
vanuit uren, reviews en auditlog blijven intact maar wijzen naar een anoniem
record.

## Indexen die ertoe doen

`users(email)` uniek; `sessions(token_hash)` uniek; `professional_profiles(lat,
lng)`, `(availability, available_from)`, `(trade)`; `projects(status,
start_date)`, `(lat, lng)`; `applications(project_id, profile_id)` uniek;
`messages(conversation_id, created_at)`; `notifications(user_id, read_at,
created_at)`; `certificates(expires_at, status)` voor de verloopwaarschuwing;
`audit_log(object_type, object_id)` en `(actor_id, created_at)`.

Voor afstandszoeken op grote schaal: PostGIS met een GiST-index op een
`geography`-kolom, ingevuld vanuit `lat`/`lng`. Het datamodel hoeft daar niet
voor te veranderen; alleen `searchProjects` en `candidatesForProject` gaan dan
filteren in SQL in plaats van in geheugen.
