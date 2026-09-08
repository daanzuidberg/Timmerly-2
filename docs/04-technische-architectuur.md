# 4. Technische architectuur

## Stack

| Laag | Keuze | Waarom |
| --- | --- | --- |
| Taal | TypeScript, strict, `noUncheckedIndexedAccess` | Eén taal van database tot browser; fouten bij compileren, niet in productie |
| Web | Next.js 15 (App Router, React 19, Server Actions) | Server-rendering voor SEO en snelheid; formulieren werken zonder client-JS; mutaties zonder losse API-laag |
| Database | PostgreSQL 16 + Drizzle ORM | Relationeel, transacties, JSONB waar het past; Drizzle is SQL-nabij en typeveilig zonder codegeneratie |
| Styling | Tailwind 4 met huisstijltokens | Consistente, rustige UI; geen componentbibliotheek die de identiteit bepaalt |
| Validatie | Zod 4 (`@timmerly/core`) | Eén schema voor client en server |
| Tests | Vitest | Snel, TypeScript-native |
| Achtergrond | Eigen worker op de `jobs`-tabel | Geen extra infra tot het nodig is |

## Monorepo

```
apps/web                 Next.js-applicatie (UI, server actions, middleware, worker)
packages/core            domeinenums, validatie, geo, datums — geen afhankelijkheden op db of web
packages/db              Drizzle-schema, relaties, migraties, seed, client
packages/auth            wachtwoordhashing (scrypt), tokens, TOTP, geheimversleuteling
packages/matching        matching-engine (puur, getest, geen database)
packages/compliance      ZZP-regelset en evaluator (puur, getest)
packages/eslint-config   gedeelde lintregels
prototype/               klikbaar UX-prototype (referentie, geen productiecode)
docs/                    deze documenten
infra/                   docker-compose voor lokale Postgres
```

De afhankelijkheidsrichting is strikt: `core` ← `db`, `matching`, `compliance`,
`auth` ← `web`. De domeinlogica (matching, compliance) kent geen database; de
web-app vertaalt rijen naar feiten (`apps/web/src/lib/matching.ts`). Dat maakt
de engines testbaar en herbruikbaar in een toekomstige API of app.

## Runtime

```
browser ──HTTPS──▶ Next.js (Node 22)
                    ├─ middleware: cookiecontrole + redirect
                    ├─ server components: lezen via Drizzle (pool, max 10)
                    ├─ server actions: schrijven, validatie, autorisatie, audit
                    └─ /api/health
worker (apart proces) ──▶ jobs-tabel, certificaatwaarschuwingen, opschonen
PostgreSQL 16
```

Mutaties lopen uitsluitend via server actions. Elke action doet in vaste
volgorde: sessie ophalen → rol controleren → eigenaarschap controleren
(`ownedProject`, `loadApplication`) → Zod-validatie → schrijven → melding →
audit → `revalidatePath`. Er is bewust geen generieke REST-API in de MVP; als
een app of partnerkoppeling die nodig heeft, worden dezelfde actions achter
route handlers gezet (`app/api/v1`) met dezelfde autorisatie.

## Configuratie

`.env` (zie `.env.example`): `DATABASE_URL`, `SESSION_SECRET` (≥ 32 tekens),
`APP_URL`, `MAIL_TRANSPORT`, optioneel `ANTHROPIC_API_KEY`. `apps/web/src/lib/env.ts`
valideert bij opstarten. Domeinconfiguratie (gewichten, regelset, flags,
plannen) staat in de database en is via `/admin/instellingen` aan te passen.

## Lokaal draaien

```sh
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev                                   # http://localhost:3000
pnpm --filter @timmerly/web worker         # optioneel: mails en waarschuwingen
```

CI (`.github/workflows/ci.yml`) draait typecheck, lint, migraties tegen een
echte Postgres, alle tests en de productiebuild.

## Schaalpad

| Gebruikers | Wat verandert | Wat niet |
| --- | --- | --- |
| tot 10.000 | Eén Next.js-instance + één Postgres + één worker | — |
| tot 100.000 | Meerdere web-instances achter een load balancer; rate limiting en sessiecache naar Redis; worker naar BullMQ; PostGIS voor afstandsfilters; read replica; objectopslag (S3-compatibel) voor documenten | Domeinlogica, datamodel, server actions |
| 1.000.000+ | Matches vooruit berekenen in een `matches`-tabel bij profiel- en projectwijziging (event-gedreven); zoekindex (Postgres full-text of OpenSearch); partitionering van `messages`, `audit_log`, `security_events` op datum; CDN voor publieke pagina's | Engines en API-contracten |

De keuzes die later lastig terug te draaien zijn — datamodel, autorisatie in
de actions, engines los van de database, configuratie als data — zijn nu
gemaakt. De keuzes die eenvoudig te vervangen zijn — in-memory rate limiter,
polling in de chat, DB-queue, console-mail — zijn bewust eenvoudig gehouden.
