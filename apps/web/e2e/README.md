# Rooktest

`smoke.mjs` drijft de belangrijkste flows aan in een echte browser tegen een
draaiende app met seed-data: publieke pagina's, registratie en onboarding,
interesse tonen, kandidaten en voorstel als opdrachtgever, uren goedkeuren,
chat, admin-verificatie en auditlog, blokkeren en rate limiting (43 controles).

```sh
cp .env.example .env && pnpm db:migrate && pnpm db:seed
pnpm build && pnpm start > server.log &
npx playwright install chromium
E2E_SERVER_LOG=server.log pnpm --filter @timmerly/web e2e
```

Zonder `E2E_SERVER_LOG` wordt de e-mailverificatie via de database gezet in
plaats van via de link uit de gelogde mail. De test is idempotent: hij maakt
per run een nieuwe vakman aan en zet demo-statussen terug waar nodig.
