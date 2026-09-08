# Timmerly

Het landelijke matchingplatform voor de bouw: aannemers en bouwprofessionals
vinden elkaar op basis van vak, ervaring, afstand, beschikbaarheid en
geverifieerde certificaten. Geen vacaturebank — elke match heeft een score
mét uitleg, beide kanten zijn gescreend, en gesprek, voorstel, uren en review
lopen in één omgeving.

## Starten

```sh
cp .env.example .env                              # DATABASE_URL, SESSION_SECRET, APP_URL
docker compose -f infra/docker-compose.yml up -d  # PostgreSQL 16
pnpm install
pnpm db:migrate && pnpm db:seed                   # schema + demodata
pnpm dev                                          # http://localhost:3000
```

Demo-accounts na `pnpm db:seed` (wachtwoord voor allemaal `Timmerly-demo-2026`):

| Rol | E-mail |
| --- | --- |
| Admin | admin@timmerly.nl |
| Vakman (zzp, geverifieerd) | daan@verhoeventimmerwerken.nl |
| Opdrachtgever (geverifieerd) | planning@vandijkbouw.nl |
| Opdrachtgever (nieuw, ongeverifieerd) | jan@janssenbouw.nl |

Mails (verificatielinks, meldingen) worden in ontwikkeling naar de terminal
gelogd. De worker voor e-mail en certificaatwaarschuwingen:
`pnpm --filter @timmerly/web worker`.

## Controleren

```sh
pnpm typecheck   # alle packages en de app
pnpm lint
pnpm test        # matching, compliance, auth, core
pnpm build       # productiebuild
```

## Structuur

```
apps/web               Next.js 15-app: pagina's, server actions, worker
packages/core          domeinwaarden, validatie (Zod), geo, datums
packages/db            Drizzle-schema, migraties, seed
packages/auth          scrypt, tokens, TOTP
packages/matching      matching-engine met uitleg (puur, getest)
packages/compliance    ZZP-check: versiebeheerde regelset (puur, getest)
docs/                  architectuur, flows, datamodel, security, roadmap
prototype/             klikbaar UX-prototype (referentie)
infra/                 docker-compose
```

Lees [docs/README.md](docs/README.md) voor de volledige architectuur en de
roadmap.
