# 5. Security-architectuur

Uitgangspunt: OWASP Top 10 en ASVS-niveau 2 als lat. Beveiliging zit in de
structuur (waar autorisatie gebeurt, wat er niet wordt opgeslagen), niet in
losse checks.

## Accounts en sessies

| Onderwerp | Implementatie |
| --- | --- |
| Wachtwoorden | scrypt (N=2¹⁷, r=8, p=1) via Node-crypto; NFKC-normalisatie; formaat met parameters zodat oude hashes bij login opnieuw gehasht worden (`needsRehash`) |
| Wachtwoordbeleid | ≥ 12 tekens, letters én cijfers (`passwordSchema`) |
| Sessies | Serverzijdig in `sessions`; cookie bevat een willekeurig token, DB bewaart SHA-256; `httpOnly`, `sameSite=lax`, `secure` in productie, 30 dagen; intrekbaar per sessie en in bulk |
| 2FA | TOTP (RFC 6238) met ±1 stap tolerantie; geheim AES-256-GCM-versleuteld met een sleutel afgeleid van `SESSION_SECRET`; sessie krijgt `mfaPassed` pas na de code |
| Brute force | Token bucket per IP en per e-mailadres op login, registratie, reset, 2FA en hermail; account 15 minuten vergrendeld na 8 mislukte pogingen |
| Enumeratie | Login, registratie en wachtwoordreset geven hetzelfde antwoord of het adres bestaat of niet |
| Tokens | Eenmalig, gehasht opgeslagen, met verloopdatum en `usedAt` (e-mailverificatie 24 u, reset 1 u) |
| Wachtwoordwijziging | Trekt alle andere sessies in en logt een beveiligingsgebeurtenis |
| Beveiligingslog | `security_events`: login ok/mislukt, wachtwoord, 2FA, sessie ingetrokken — zichtbaar voor de gebruiker onder Instellingen |

## Autorisatie (RBAC + eigenaarschap)

* Rollen: `professional`, `company`, `moderator`, `admin` — op het account.
* `requireUser()` en `requireRole()` in elke pagina en action; de `(app)`-layout
  is een tweede vangnet.
* Eigenaarschap wordt altijd in de query afgedwongen: een project via
  `companyId`, een aanmelding via `loadApplication()` dat vakman, bedrijf of
  staf bepaalt. Een geraden UUID levert `notFound()` of een redirect, nooit
  data.
* Moderators kunnen verifiëren, projecten beoordelen, meldingen en reviews
  behandelen; alleen admins blokkeren gebruikers en wijzigen configuratie.
* Namen van vakmensen zijn voor bedrijven pas zichtbaar na een aanmelding of
  benadering (`revealed` in `/vakmensen/[id]`).

## Invoer en uitvoer

* Alle invoer via Zod-schema's uit `@timmerly/core`; `formToObject` accepteert
  alleen strings.
* SQL uitsluitend via Drizzle met parameters; geen stringconcatenatie.
* React escapet uitvoer; er is geen `dangerouslySetInnerHTML`.
* Server Actions van Next.js controleren `Origin`/`Host` (CSRF); cookies zijn
  `sameSite=lax`.
* Uploads komen in fase 2 (objectopslag, typecontrole, malware-scan; nooit in
  de database).

## Headers en transport

`next.config.ts` zet op elke response: CSP (`default-src 'self'`,
`frame-ancestors 'none'`, `form-action 'self'`), HSTS met preload,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strikte
`Referrer-Policy` en een beperkte `Permissions-Policy`. `poweredByHeader` uit.
Nonce-gebaseerde CSP voor scripts is de volgende stap.

## Gegevensminimalisatie

* Geen kopieën van identiteitsbewijzen; alleen uitkomst en providerreferentie.
* Exacte coördinaten alleen serverzijdig; UI toont woonplaats.
* IP-adressen alleen in sessies, beveiligingslog en auditlog, met bewaartermijn.
* Wachtwoordhash en 2FA-geheim worden nooit geëxporteerd (`exportMyData`
  sluit ze uit).

## Fraudepreventie

* `users.riskScore` (intern) en `professional_profiles.trustScore` (intern,
  grof zichtbaar als "Hoog/Gemiddeld/Opbouwend").
* Meldingen (`reports`) met redenen fraude, nepaccount, ongewenst gedrag,
  onveilig werk, spam; afhandeling verlaagt de trustscore van de gemelde.
* Reviews alleen na een afgeronde opdracht, één per richting, gemodereerd.
* Blokkeren van gebruikers trekt sessies in; alles in de auditlog.
* Fase 2: signalen voor meerdere accounts (zelfde telefoon/KvK/IP-patroon),
  reviewmanipulatie (wederkerige 5-sterren tussen dezelfde partijen), en een
  velocity-check op berichten.

## Auditing en monitoring

* `audit_log`: append-only, met actor, rol, actie, object, before/after, IP.
* `/api/health` voor load balancer en uptime-monitoring.
* Aanbevolen in productie: gestructureerde logs naar een centrale
  logvoorziening, foutmonitoring (Sentry), en alerts op pieken in
  `login_failed` en `reports`.
