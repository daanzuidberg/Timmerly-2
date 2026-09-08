/* eslint-disable no-console */
/**
 * Rooktest van de belangrijkste flows tegen een draaiende app met seed-data.
 *
 *   pnpm db:seed && pnpm build && pnpm start          (in één terminal)
 *   E2E_SERVER_LOG=server.log pnpm --filter @timmerly/web e2e
 *
 * Vereist: `playwright` (npx playwright install chromium), psql op DATABASE_URL.
 * Wordt bewust niet in CI gedraaid tot er een eigen Playwright-runner is; lokaal
 * en voor releases is dit de referentie voor "werkt het echt".
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const DB = process.env.DATABASE_URL ?? 'postgres://timmerly:timmerly@localhost:5432/timmerly';
const SERVER_LOG = process.env.E2E_SERVER_LOG ?? '';
const PW = 'Timmerly-demo-2026';
const sql = (q) => execSync(`psql "${DB}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim();
const browser = await chromium.launch();
const results = [];
const check = (label, cond, extra = '') => { results.push([cond, label, extra]); console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`); };
const errors = [];
async function ctx() { const c = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); return p; }
const text = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ');
async function login(p, email) { await p.goto(BASE + '/inloggen'); await p.fill('#email', email); await p.fill('#password', PW); await p.click('button[type=submit]'); await p.waitForURL(/dashboard|admin|onboarding|bedrijf/); }

// ── 1. Publiek ────────────────────────────────────────────────────────────
{
  const p = await ctx();
  await p.goto(BASE + '/');
  const t = await text(p);
  check('landing toont hero en actuele projecten', t.includes('Goede bouwprojecten') && t.includes('Waar nu timmermannen gezocht worden') && t.includes('Almere'));
  await p.goto(BASE + '/projecten?province=Overijssel');
  check('projectfilter provincie', (await text(p)).includes('1 project'), (await text(p)).match(/\d+ projecten?/)?.[0]);
  await p.goto(BASE + '/projecten');
  const n = (await text(p)).match(/(\d+) projecten/)?.[1];
  check('projectoverzicht toont gepubliceerde projecten', Number(n) >= 5, `${n} projecten`);
  await p.click('a[href^="/projecten/"]:has-text("Bekijk project")');
  await p.waitForURL(/\/projecten\/[0-9a-f-]+/);
  const d = await text(p);
  check('projectdetail zonder login: eisen, geen score, CTA aanwezig', d.includes('Eisen en voorwaarden') && !d.includes('% match') && d.includes('Interesse in dit project'));
  await p.goto(BASE + '/timmerman-gezocht/zwolle');
  check('SEO-plaatspagina met projecten binnen 40 km', (await text(p)).includes('Timmerman gezocht in Zwolle') && (await text(p)).includes('Mutatietimmerman'));
  await p.goto(BASE + '/zzp-check');
  for (const label of ['De opdrachtgever stuurt dagelijks aan', 'Identiek aan eigen personeel, in hetzelfde team']) await p.getByRole('button', { name: label }).click();
  await p.getByRole('button', { name: /Voorlopige uitkomst/ }).click();
  await p.waitForSelector('text=Voorlopige uitkomst:');
  check('ZZP-check geeft voorlopige uitkomst met disclaimer', (await text(p)).includes('Voorlopige uitkomst:') && (await text(p)).toLowerCase().includes('geen juridisch advies'));
  const res = await p.goto(BASE + '/dashboard');
  check('beveiligde route zonder sessie → inloggen', p.url().includes('/inloggen?next=%2Fdashboard') && res.status() === 200);
  const h = await p.request.get(BASE + '/');
  check('security headers aanwezig', !!h.headers()['content-security-policy'] && h.headers()['x-frame-options'] === 'DENY' && !h.headers()['x-powered-by']);
  await p.context().close();
}

// ── 2. Registratie + onboarding van een nieuwe vakman ─────────────────────
const email = `e2e-${Date.now()}@test.timmerly.nl`;
{
  const p = await ctx();
  await p.goto(BASE + '/registreren?rol=professional');
  await p.fill('#firstName', 'Eva'); await p.fill('#lastName', 'Testers'); await p.fill('#email', email); await p.fill('#password', 'timmerly-e2e-2026'); await p.check('input[name=acceptTerms]');
  await p.click('button[type=submit]');
  await p.waitForURL(/registreren\/bevestig/);
  check('registratie → bevestigingspagina', (await text(p)).includes(email));
  const token = sql(`select token_hash from one_time_tokens t join users u on u.id=t.user_id where u.email='${email}' and purpose='verify_email'`);
  check('verificatietoken opgeslagen als hash', token.length === 64);
  // Zwak wachtwoord en bestaand e-mailadres
  const p2 = await ctx();
  await p2.goto(BASE + '/registreren'); await p2.fill('#firstName', 'A'); await p2.fill('#lastName', 'B'); await p2.fill('#email', 'x@y.nl'); await p2.fill('#password', 'alleenletters!!!'); await p2.check('input[name=acceptTerms]'); await p2.click('button[type=submit]');
  await p2.waitForSelector('.error');
  check('zwak wachtwoord wordt geweigerd', (await text(p2)).includes('Combineer letters en cijfers'));
  await p2.context().close();

  await p.goto(BASE + '/dashboard');
  await p.waitForURL(/onboarding/);
  check('nieuwe vakman wordt naar onboarding gestuurd', p.url().includes('/onboarding'));
  // Stap 1 vak
  await p.selectOption('#trade', 'allround_timmerman');
  await p.getByRole('button', { name: 'Aftimmering', exact: true }).click(); await p.getByRole('button', { name: 'Renovatie', exact: true }).click();
  await p.selectOption('#experienceBand', '6-10'); await p.fill('#yearsExperience', '7'); await p.selectOption('#workArrangement', 'zzp'); await p.fill('#hourlyRateMin', '46');
  await p.fill('#bio', 'Allround timmerman met zeven jaar ervaring in renovatie en aftimmering. Werk netjes en zelfstandig.');
  await p.click('button[type=submit]'); await p.waitForURL(/stap=2/);
  // Stap 2 persoonlijk
  await p.fill('#city', 'Zwolle'); await p.fill('#phone', '06 12345678'); await p.fill('#maxTravelKm', '60'); await p.check('input[name=hasDriversLicense]'); await p.check('input[name=hasOwnTransport]'); await p.check('input[name=hasOwnTools]');
  await p.click('button[type=submit]'); await p.waitForURL(/stap=25/);
  check('zzp-er krijgt stap onderneming', (await text(p)).includes('Je onderneming'));
  await p.fill('#companyName', 'Testers Timmerwerk'); await p.fill('#kvkNumber', '12345678'); await p.fill('#seat', 'Zwolle'); await p.check('input[name=hasLiabilityInsurance]');
  await p.click('button[type=submit]'); await p.waitForURL(/stap=3/);
  // Stap 3 certificaat
  await p.selectOption('#type', 'vca_basis'); await p.fill('#expiresAt', '2028-01-01'); await p.click('button[type=submit]');
  await p.waitForSelector('text=Certificaat toegevoegd');
  await p.getByRole('link', { name: 'Volgende' }).click(); await p.waitForURL(/stap=4/);
  await p.fill('#hoursPerWeek', '40'); await p.click('button[type=submit]'); await p.waitForURL(/stap=5/);
  check('stap 5 toont verificatiestatussen', (await text(p)).includes('In behandeling'));
  await p.getByRole('button', { name: 'Profiel activeren' }).click(); await p.waitForURL(/dashboard/);
  const dash = await text(p);
  check('onboarding afgerond → dashboard met welkom en matches', dash.includes('Je profiel is actief') && dash.includes('Projecten die bij je passen'));
  const geo = sql(`select round(lat::numeric,2)||','||province from professional_profiles pp join users u on u.id=pp.user_id where u.email='${email}'`);
  check('woonplaats gegeocodeerd + provincie', geo === '52.52,Overijssel', geo);
  const pct = Number(sql(`select profile_completeness from professional_profiles pp join users u on u.id=pp.user_id where u.email='${email}'`));
  check('profielvolledigheid berekend', pct >= 50 && pct < 100, `${pct}%`);
  // E-mail verifiëren via de link
  const raw = sql(`select id from users where email='${email}'`);
  // token onbekend (alleen hash) → maak via reset: we lezen de mail uit de serverlog
  if (SERVER_LOG) {
    const log = execSync(`grep -o "verifieer/[A-Za-z0-9_-]*" ${SERVER_LOG} | tail -1`).toString().trim();
    await p.goto(BASE + '/' + log);
    check('e-mailverificatie via link uit de mail', (await text(p)).includes('E-mailadres bevestigd') && sql(`select email_verified_at is not null from users where id='${raw}'`) === 't');
  } else {
    sql(`update users set email_verified_at=now() where id='${raw}'`); // zonder serverlog: direct bevestigen
  }
  // Interesse tonen
  await p.goto(BASE + '/projecten?sort=match');
  const first = await text(p);
  check('projectoverzicht ingelogd toont matchscores', /\d+% match/i.test(first));
  await p.click('a[href^="/projecten/"]:has-text("Bekijk project")'); await p.waitForURL(/\/projecten\/[0-9a-f-]+/);
  const detail = await text(p);
  check('projectdetail toont uitleg bij score', detail.includes('Waarom dit project bij je past') && detail.includes('jaar ervaring'));
  await p.getByRole('button', { name: 'Interesse in dit project' }).click();
  await p.waitForSelector('text=Interesse geregistreerd');
  check('interesse geregistreerd', true);
  await p.goto(BASE + '/aanmeldingen');
  check('aanmelding zichtbaar met funnel', (await text(p)).includes('Interesse') && (await text(p)).includes('Gesprek'));
  await p.context().close();
}

// ── 3. Opdrachtgever: kandidaten, smart match, voorstel, uren ─────────────
{
  const p = await ctx();
  await login(p, 'planning@vandijkbouw.nl');
  const dash = await text(p);
  check('bedrijfsdashboard met kerncijfers', dash.toLowerCase().includes('openstaande projecten') && dash.toLowerCase().includes('uren te keuren'));
  const almere = sql(`select id from projects where title like 'Timmerman nieuwbouw%'`);
  await p.goto(BASE + `/mijn-projecten/${almere}`);
  const m = await text(p);
  check('kandidatenoverzicht toont Daan (opdracht loopt) en Smart Match', m.includes('Daan Verhoeven') && m.includes('Opdracht loopt') && m.includes('Smart Match'));
  check('kandidaten uit smart match zijn geanonimiseerd tot contact', !/Bram Sikkema|Sanne Vos/.test(m.split('Smart Match')[1] ?? ''));
  const evaInterest = m.includes('Eva Testers');
  check('nieuwe interesse (Eva) zichtbaar bij bedrijf', evaInterest);
  if (evaInterest) {
    await p.getByRole('button', { name: 'Gesprek openen' }).first().click();
    await p.waitForSelector('text=In gesprek');
    check('gesprek geopend → fase contact', true);
    await p.getByText('Voorstel opstellen').first().click();
    await p.fill('#hourlyRate', '47'); await p.fill('#startDate', '2026-09-21');
    await p.getByRole('button', { name: 'Voorstel versturen' }).click();
    await p.waitForSelector('text=€47/u');
    check('voorstel verstuurd → fase voorstel', sql(`select stage from applications a join professional_profiles pp on pp.id=a.profile_id join users u on u.id=pp.user_id where u.email='${email}'`) === 'proposal');
  }
  // Uren goedkeuren
  const app = sql(`select a.id from applications a join projects p on p.id=a.project_id join professional_profiles pp on pp.id=a.profile_id join users u on u.id=pp.user_id where u.email='daan@verhoeventimmerwerken.nl' and p.title like 'Timmerman nieuwbouw%'`);
  sql(`update timesheets set status='submitted', decided_at=null, decided_by=null, decision_note=null where application_id='${app}'`); // idempotent bij herhaalde runs
  await p.goto(BASE + `/uren/${app}`);
  check('weekstaat week 37 zichtbaar', (await text(p)).includes('Week 37') && (await text(p)).includes('38,5 uur'));
  await p.fill('input[placeholder^="Toelichting"]', 'Akkoord, netjes ingediend');
  await p.getByRole('button', { name: 'Goedkeuren' }).click();
  await p.waitForSelector('text=Goedgekeurd');
  check('uren goedgekeurd', sql(`select status from timesheets where application_id='${app}'`) === 'approved');
  await p.goto(BASE + '/vakmensen?certificate=vca_basis&maxKm=100');
  check('vakmensen zoeken op certificaat en afstand', (await text(p)).includes('Allround timmerman') && (await text(p)).includes('VCA'));
  await p.context().close();
}

// ── 4. Vakman: voorstel accepteren, chat, opdracht ────────────────────────
{
  const p = await ctx();
  await p.goto(BASE + '/inloggen'); await p.fill('#email', email); await p.fill('#password', 'timmerly-e2e-2026'); await p.click('button[type=submit]'); await p.waitForURL(/dashboard/);
  await p.goto(BASE + '/aanmeldingen');
  const a = await text(p);
  check('vakman ziet voorstel met tarief', a.includes('Voorstel:') && a.includes('€47/u'));
  await p.getByRole('button', { name: 'Voorstel accepteren' }).click();
  await p.waitForSelector('text=Akkoord');
  check('voorstel geaccepteerd → akkoord', sql(`select stage from applications a join professional_profiles pp on pp.id=a.profile_id join users u on u.id=pp.user_id where u.email='${email}'`) === 'agreed');
  await p.getByRole('link', { name: 'Gesprek' }).first().click(); await p.waitForURL(/berichten\//);
  await p.fill('input[name=body]', 'Top, ik ben er de 21e om 7 uur.');
  await p.getByRole('button', { name: 'Stuur' }).click();
  await p.waitForSelector('text=Top, ik ben er');
  check('chatbericht verstuurd en zichtbaar', true);
  const notif = sql(`select count(*) from notifications n join users u on u.id=n.user_id where u.email='planning@vandijkbouw.nl' and type='message'`);
  check('wederpartij kreeg melding', Number(notif) >= 1);
  await p.context().close();
}

// ── 5. Admin: verificatie, auditlog, blokkeren ────────────────────────────
{
  const p = await ctx();
  await login(p, 'admin@timmerly.nl');
  check('admin landt op beheer', p.url().includes('/admin') && (await text(p)).includes('Werkvoorraad'));
  await p.goto(BASE + '/admin/verificaties');
  const v = await text(p);
  check('verificatiewachtrij toont nieuwe zzp-claim en certificaat', v.includes('Testers Timmerwerk') && v.includes('Eva Testers'));
  const certCard = p.locator('li', { hasText: email }).filter({ hasText: 'VCA Basis' }).first();
  await certCard.locator('input').fill('Kopie gecontroleerd');
  await certCard.getByRole('button', { name: 'Verifiëren' }).click();
  await p.waitForTimeout(800);
  check('certificaat geverifieerd', sql(`select c.status from certificates c join professional_profiles pp on pp.id=c.profile_id join users u on u.id=pp.user_id where u.email='${email}'`) === 'verified');
  await p.goto(BASE + '/admin/auditlog?q=certificate');
  check('auditlog bevat de verificatie', (await text(p)).includes('certificate.verified'));
  await p.goto(BASE + '/admin/gebruikers?q=jan@janssenbouw');
  await p.fill('input[placeholder=Reden]', 'Testblokkade'); await p.getByRole('button', { name: 'Blokkeren' }).click();
  await p.waitForSelector('text=Geblokkeerd');
  check('gebruiker geblokkeerd', sql(`select status from users where email='jan@janssenbouw.nl'`) === 'suspended');
  await p.fill('input[placeholder=Reden]', 'x'); await p.getByRole('button', { name: 'Deblokkeren' }).click(); await p.waitForTimeout(600);
  await p.goto(BASE + '/admin/instellingen');
  const cfg = (await p.locator('textarea').evaluateAll((els) => els.map((e) => e.value))).join(' ');
  check('configuratie zichtbaar (gewichten, regelset)', cfg.includes('specialism') && cfg.includes('2026-09'));
  await p.context().close();
}

// ── 6. Geblokkeerd account, rate limiting, uitloggen ──────────────────────
{
  sql(`update users set status='suspended' where email='sanne.vos@gmail.com'`);
  const p = await ctx();
  await p.goto(BASE + '/inloggen'); await p.fill('#email', 'sanne.vos@gmail.com'); await p.fill('#password', PW); await p.click('button[type=submit]');
  await p.waitForSelector('[role=alert]');
  check('geblokkeerd account kan niet inloggen', (await text(p)).includes('geblokkeerd'));
  sql(`update users set status='active' where email='sanne.vos@gmail.com'`);
  for (let i = 0; i < 6; i++) { await p.fill('#email', 'kevin.bakker@outlook.com'); await p.fill('#password', 'fout-wachtwoord-1'); await p.click('button[type=submit]'); await p.waitForSelector('[role=alert]'); }
  const failed = Number(sql(`select failed_login_count from users where email='kevin.bakker@outlook.com'`));
  const msg = await text(p);
  check('mislukte pogingen geteld of rate limiter grijpt in', failed >= 1 && (msg.includes('klopt niet') || msg.includes('Te veel inlogpogingen')), `${failed} mislukt`);
  sql(`update users set failed_login_count=0 where email='kevin.bakker@outlook.com'`);
  await p.context().close();
}

await browser.close();
const fails = results.filter((r) => !r[0]);
console.log(`\n${results.length - fails.length}/${results.length} checks geslaagd`);
if (errors.length) console.log('Browserfouten:\n' + [...new Set(errors)].join('\n'));
process.exit(fails.length ? 1 : 0);
