# Live zetten op Vercel

De database staat al klaar. Dit document is het enige wat nog moet gebeuren,
en het zijn drie velden en een klik.

## Database (al gedaan)

Project `timmerly-production` draait op Supabase (project-ref
`kvzdoylcucrkaqeyyyep`, regio `eu-central-1`). Het schema (30 tabellen) en de
basisconfiguratie (beroepen, abonnementen, matchinggewichten, ZZP-regelset)
staan er al in — rechtstreeks via de Supabase-beheer-API, dus zonder dat het
databasewachtwoord nodig was.

Wat er nog **niet** in staat: demo-accounts. Voor een live omgeving is dat
juist goed — je begint schoon en maakt je eigen eerste account aan via
`/registreren`, met een echt wachtwoord dat alleen jij kent.

## Stap 1 — Wachtwoord ophalen

De databasewachtwoord kon niet via de API worden ingesteld (Supabase staat
dat voor de hoofdrol alleen via het dashboard toe). Eenmalig:

1. Open [Database-instellingen](https://supabase.com/dashboard/project/kvzdoylcucrkaqeyyyep/settings/database).
2. Klik **Reset database password** (of gebruik het wachtwoord dat je kreeg
   bij het aanmaken, als je dat bewaard hebt).
3. Kopieer onder **Connection string** de **Transaction pooler**-variant
   (poort 6543) — die is gemaakt voor kortlevende serverless-verbindingen
   zoals Vercel functions. Hij ziet er zo uit:

   ```
   postgres://postgres.kvzdoylcucrkaqeyyyep:[WACHTWOORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

## Stap 2 — Project op Vercel

1. Ga naar [vercel.com/new](https://vercel.com/new) en importeer
   `daanzuidberg/Timmerly-2`.
2. **Root Directory** → `apps/web` (Vercel herkent de pnpm-workspace
   automatisch en installeert vanuit de repo-root).
3. Framework preset: Next.js (automatisch gedetecteerd, niets aanpassen).

## Stap 3 — Environment variables

Bij hetzelfde import-scherm, onder **Environment Variables**:

| Naam | Waarde |
| --- | --- |
| `DATABASE_URL` | de connection string uit stap 1 |
| `SESSION_SECRET` | `Lxm9-Vo0hzaaASNo97in_aZkOQ0IVyvFsYkHJywVv9PoYjl0aRTBhb1FVi05khRO` |
| `APP_URL` | laat eerst leeg; na de eerste deploy krijg je een `*.vercel.app`-domein — vul dat hier in en deploy opnieuw (Vercel → Deployments → Redeploy) |
| `MAIL_TRANSPORT` | `console` (verificatiemails komen dan in de Vercel function-logs terecht; zie hieronder) |

`SESSION_SECRET` hierboven is een verse, willekeurige waarde — gebruik hem
gerust, hij is nergens anders gebruikt.

Klik **Deploy**. De build duurt ongeveer een minuut.

## Stap 4 — Eerste keer inloggen

Zonder een echt e-mailtransport (Postmark, Resend, SES — niet ingesteld) komt
de verificatiemail in de serverlogs terecht, niet in een echte inbox:

1. Registreer een account op `https://<jouw-domein>.vercel.app/registreren`.
2. Vercel-dashboard → project → **Logs** (of `vercel logs <deployment-url>`).
3. Zoek de regel `MAIL naar ...` met de link `/verifieer/<token>`, open die.

Voor een eerste admin-account: maak een gewoon account aan en verhoog de rol
handmatig in Supabase (eenmalig, via de SQL-editor in het dashboard):

```sql
update users set role = 'admin' where email = 'jouw@adres.nl';
```

## Daarna

- **Echte e-mail**: zet `MAIL_TRANSPORT` op iets anders dan `console` pas
  nadat `apps/web/src/lib/mail.ts` een echt transport implementeert (SMTP of
  een provider-API) — dat staat in `docs/09-mvp-roadmap.md` als eerste
  fase-2-item.
- **Achtergrondtaken** (certificaatwaarschuwingen, e-maildigest): Vercel
  draait geen lang lopend proces. Zet `pnpm --filter @timmerly/web worker`
  als [Vercel Cron Job](https://vercel.com/docs/cron-jobs) die elke paar
  minuten `node dist/worker.js --once` aanroept, of draai de worker apart
  (Railway/Fly, klein en goedkoop) tegen dezelfde `DATABASE_URL`.
- **Custom domein**: Vercel → project → Settings → Domains; werk daarna
  `APP_URL` bij en redeploy.
