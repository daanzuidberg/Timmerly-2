import { hashPassword } from '@timmerly/auth';
import { ACTIVE_TRADES, TRADES, TRADE_LABELS, geocode } from '@timmerly/core';
import { eq } from 'drizzle-orm';
import { closeDb, getDb } from './client';
import * as s from './schema';

/**
 * Ontwikkel- en demodata. Idempotent: bestaande e-mailadressen worden
 * overgeslagen. Alle namen, bedrijven en cijfers zijn fictief.
 *
 *   pnpm db:seed
 *
 * Inloggen: admin@timmerly.nl / daan@verhoeventimmerwerken.nl / planning@vandijkbouw.nl
 * Wachtwoord voor alle accounts: Timmerly-demo-2026
 */
const PASSWORD = 'Timmerly-demo-2026';

async function main() {
  const db = getDb();
  const passwordHash = await hashPassword(PASSWORD);
  const now = new Date();

  // ── Referentiedata ───────────────────────────────────────────────────────
  await db.insert(s.trades).values(TRADES.map((slug, i) => ({ slug, label: TRADE_LABELS[slug], active: ACTIVE_TRADES.includes(slug), sortOrder: i })))
    .onConflictDoNothing();

  await db.insert(s.plans).values([
    { slug: 'free', audience: 'professional', label: 'Gratis', priceCentsMonthly: 0, features: { matches: true, chat: true } },
    { slug: 'pro_premium', audience: 'professional', label: 'Premium vakman', priceCentsMonthly: 990, features: { priorityMatches: true, insights: true, badgeHighlight: true } },
    { slug: 'company_starter', audience: 'company', label: 'Starter', priceCentsMonthly: 0, features: { openProjects: 1, talentpool: false } },
    { slug: 'company_professional', audience: 'company', label: 'Professional', priceCentsMonthly: 14900, features: { openProjects: 10, talentpool: true, featuredProjects: 2 } },
    { slug: 'company_enterprise', audience: 'company', label: 'Enterprise', priceCentsMonthly: 0, features: { openProjects: -1, talentpool: true, api: true, sla: true } }
  ]).onConflictDoNothing();

  await db.insert(s.settings).values([
    { key: 'matching.weights', value: { specialism: 20, experience: 14, distance: 16, certificates: 12, availability: 14, rate: 8, logistics: 6, reputation: 6, hours: 4 } },
    { key: 'compliance.rulesetVersion', value: '2026-09' },
    { key: 'features', value: { chatAttachments: false, pushNotifications: false, aiProjectDescription: true } }
  ]).onConflictDoNothing();

  // ── Accounts ─────────────────────────────────────────────────────────────
  async function user(u: { email: string; role: (typeof s.users)['$inferInsert']['role']; firstName: string; lastName: string; phone?: string }) {
    const existing = await db.query.users.findFirst({ where: eq(s.users.email, u.email) });
    if (existing) return existing;
    const [row] = await db.insert(s.users).values({
      ...u, passwordHash, emailVerifiedAt: now, phoneVerifiedAt: u.phone ? now : null, termsAcceptedAt: now
    }).returning();
    await db.insert(s.notificationPreferences).values({ userId: row!.id }).onConflictDoNothing();
    await db.insert(s.verifications).values({ userId: row!.id, kind: 'email', status: 'verified', provider: 'internal', reviewedAt: now });
    return row!;
  }

  const admin = await user({ email: 'admin@timmerly.nl', role: 'admin', firstName: 'Sanne', lastName: 'Bakker' });
  await user({ email: 'recruiter@timmerly.nl', role: 'moderator', firstName: 'Mark', lastName: 'de Jong' });

  // ── Bedrijven ────────────────────────────────────────────────────────────
  const companies = [
    { email: 'planning@vandijkbouw.nl', firstName: 'Peter', lastName: 'van Dijk', name: 'Van Dijk Bouw B.V.', kvk: '32145678', city: 'Almere', type: 'Aannemer woningbouw', employees: 85, specialisms: ['nieuwbouw', 'aftimmering', 'woningbouw'], verified: true,
      description: 'Familiebedrijf met 85 medewerkers, gespecialiseerd in grondgebonden nieuwbouw in Flevoland en Noord-Holland. We werken met vaste ploegen en zetten zzp’ers in op piekwerk.' },
    { email: 'werk@beterwonenonderhoud.nl', firstName: 'Ingrid', lastName: 'Smit', name: 'Beter Wonen Onderhoud', kvk: '54321987', city: 'Zwolle', type: 'Onderhoudsbedrijf', employees: 40, specialisms: ['onderhoud', 'mutatiewerk', 'renovatie'], verified: true,
      description: 'Onderhoudspartner van drie woningcorporaties in Overijssel. Doorlopend mutatiewerk en planmatig onderhoud.' },
    { email: 'info@kroonbouwinfra.nl', firstName: 'Rob', lastName: 'Kroon', name: 'Kroon Bouw & Infra', kvk: '67891234', city: 'Utrecht', type: 'Utiliteits- en infrabouw', employees: 220, specialisms: ['ruwbouw', 'betontimmerwerk', 'utiliteitsbouw'], verified: true,
      description: 'Utiliteitsbouw en civiele projecten in de Randstad. Grote betonbouwprojecten met eigen werkvoorbereiding.' },
    { email: 'jan@janssenbouw.nl', firstName: 'Jan', lastName: 'Janssen', name: 'Janssen Bouw', kvk: '11223344', city: 'Deventer', type: 'Aannemer renovatie', employees: 12, specialisms: ['renovatie', 'kozijnen_en_deuren'], verified: false,
      description: 'Klein renovatiebedrijf, net aangemeld.' }
  ];
  const companyIds: Record<string, string> = {};
  for (const c of companies) {
    const u = await user({ email: c.email, role: 'company', firstName: c.firstName, lastName: c.lastName, phone: '06 12345678' });
    const geo = geocode(c.city);
    const existing = await db.query.companyProfiles.findFirst({ where: eq(s.companyProfiles.userId, u.id) });
    if (existing) { companyIds[c.name] = existing.id; continue; }
    const [row] = await db.insert(s.companyProfiles).values({
      userId: u.id, name: c.name, kvkNumber: c.kvk, city: c.city, province: geo?.province, lat: geo?.lat, lng: geo?.lng, companyType: c.type,
      description: c.description, specialisms: c.specialisms, employeeCount: c.employees, phone: '06 12345678', verifiedAt: c.verified ? now : null,
      trustScore: c.verified ? 80 : 50, onboardingCompletedAt: now
    }).returning();
    companyIds[c.name] = row!.id;
    await db.insert(s.verifications).values({ userId: u.id, kind: 'company', status: c.verified ? 'verified' : 'pending', provider: 'kvk', evidence: { kvkNumber: c.kvk, name: c.name }, reviewedBy: c.verified ? admin.id : null, reviewedAt: c.verified ? now : null });
  }

  // ── Vakmensen ────────────────────────────────────────────────────────────
  const pros = [
    { email: 'daan@verhoeventimmerwerken.nl', firstName: 'Daan', lastName: 'Verhoeven', trade: 'allround_timmerman', specialisms: ['aftimmering', 'kozijnen_en_deuren', 'woningbouw', 'renovatie'], years: 8, band: '6-10', city: 'Kampen', km: 60, rate: 47, arrangement: 'zzp', from: '2026-09-14', trust: 88,
      zzp: { companyName: 'Verhoeven Timmerwerken', kvkNumber: '76543210', btwNumber: 'NL001234567B01', seat: 'Kampen', hasLiabilityInsurance: true },
      certs: [{ type: 'vca_basis', status: 'verified', expiresAt: '2026-10-07' }, { type: 'bhv', status: 'verified', expiresAt: '2028-03-01' }, { type: 'hoogwerker', status: 'pending', expiresAt: '2029-01-01' }],
      bio: 'Allround timmerman met acht jaar ervaring in woningbouw en renovatie. Zelfstandig, netjes en op tijd. Eigen bus en gereedschap.',
      history: [{ title: 'Nieuwbouw 120 woningen', role: 'Allround timmerman', client: 'Bouwgroep Nagel', city: 'Zwolle', start: '2025-01-06', end: '2025-08-29', desc: 'Ruwbouw en aftimmering in een team van zes.' }, { title: 'Mutatieonderhoud 80 woningen', role: 'Mutatietimmerman', client: 'Beter Wonen Onderhoud', city: 'Kampen', start: '2024-06-03', end: '2024-11-01', desc: 'Mutatiewerk en kleine renovaties.' }] },
    { email: 'youssef@elamrani-bouw.nl', firstName: 'Youssef', lastName: 'El Amrani', trade: 'betontimmerman', specialisms: ['betontimmerwerk', 'ruwbouw', 'utiliteitsbouw'], years: 11, band: '10+', city: 'Lelystad', km: 80, rate: 51, arrangement: 'zzp', from: '2026-09-21', trust: 85,
      zzp: { companyName: 'El Amrani Bouw', kvkNumber: '65432109', seat: 'Lelystad', hasLiabilityInsurance: true },
      certs: [{ type: 'vca_vol', status: 'verified', expiresAt: '2027-05-01' }], bio: 'Betontimmerman, elf jaar ervaring met bekisting en stelwerk op grote utiliteitsprojecten. Voorman-ervaring.', history: [] },
    { email: 'marijn@dewit.nl', firstName: 'Marijn', lastName: 'de Wit', trade: 'mutatietimmerman', specialisms: ['mutatiewerk', 'onderhoud', 'aftimmering'], years: 6, band: '6-10', city: 'Zwolle', km: 50, rate: 44, arrangement: 'either', from: null, trust: 78,
      zzp: null, certs: [{ type: 'vca_basis', status: 'verified', expiresAt: '2027-02-01' }], bio: 'Mutatie- en aftimmerwerk, per direct beschikbaar. Loondienst of zzp bespreekbaar.', history: [] },
    { email: 'bram@sikkema-timmerwerk.nl', firstName: 'Bram', lastName: 'Sikkema', trade: 'voorman_timmerman', specialisms: ['woningbouw', 'nieuwbouw', 'stelwerk', 'aftimmering'], years: 15, band: '10+', city: 'Emmeloord', km: 75, rate: 56, arrangement: 'zzp', from: '2026-10-01', trust: 92,
      zzp: { companyName: 'Sikkema Timmerwerk', kvkNumber: '87654321', seat: 'Emmeloord', hasLiabilityInsurance: true },
      certs: [{ type: 'vca_vol', status: 'verified', expiresAt: '2028-01-01' }, { type: 'bhv', status: 'verified', expiresAt: '2027-06-01' }], bio: 'Voorman timmerman, vijftien jaar ervaring, ploegen van 4–8 man aangestuurd op projecten van 80+ woningen.', history: [] },
    { email: 'kevin.bakker@outlook.com', firstName: 'Kevin', lastName: 'Bakker', trade: 'timmerman', specialisms: ['afbouw', 'wanden_en_plafonds'], years: 4, band: '3-5', city: 'Apeldoorn', km: 40, rate: null, arrangement: 'employment', from: null, trust: 55,
      zzp: null, certs: [{ type: 'vca_basis', status: 'pending', expiresAt: '2027-09-01' }], bio: 'Afbouwtimmerman, zoek werk in loondienst in de regio Apeldoorn.', history: [] },
    { email: 'sanne.vos@gmail.com', firstName: 'Sanne', lastName: 'Vos', trade: 'timmerman', specialisms: ['renovatie', 'kozijnen_en_deuren'], years: 2, band: '0-2', city: 'Haarlem', km: 40, rate: 38, arrangement: 'zzp', from: null, trust: 45,
      zzp: { companyName: 'Vos Timmerwerk', kvkNumber: '99887766', seat: 'Haarlem', hasLiabilityInsurance: false }, certs: [], bio: 'Net gestart als zzp’er na twee jaar in loondienst bij een renovatiebedrijf.', history: [] }
  ] as const;

  const proIds: Record<string, { profileId: string; userId: string }> = {};
  for (const p of pros) {
    const u = await user({ email: p.email, role: 'professional', firstName: p.firstName, lastName: p.lastName, phone: '06 12345678' });
    const existing = await db.query.professionalProfiles.findFirst({ where: eq(s.professionalProfiles.userId, u.id) });
    if (existing) { proIds[p.email] = { profileId: existing.id, userId: u.id }; continue; }
    const geo = geocode(p.city);
    const [row] = await db.insert(s.professionalProfiles).values({
      userId: u.id, trade: p.trade, specialisms: [...p.specialisms], experienceBand: p.band, yearsExperience: p.years, bio: p.bio, city: p.city, province: geo?.province,
      lat: geo?.lat, lng: geo?.lng, maxTravelKm: p.km, hasDriversLicense: true, hasOwnTransport: p.arrangement !== 'employment', hasOwnTools: p.arrangement !== 'employment',
      workArrangement: p.arrangement, hourlyRateMin: p.rate, availableFrom: p.from, zzp: p.zzp, profileCompleteness: p.certs.length ? 82 : 55, trustScore: p.trust,
      onboardingStep: 6, onboardingCompletedAt: now
    }).returning();
    proIds[p.email] = { profileId: row!.id, userId: u.id };
    for (const c of p.certs) {
      await db.insert(s.certificates).values({ profileId: row!.id, type: c.type, expiresAt: c.expiresAt, issuedAt: '2024-01-15', status: c.status, reviewedBy: c.status === 'verified' ? admin.id : null, reviewedAt: c.status === 'verified' ? now : null });
    }
    if (p.zzp) await db.insert(s.verifications).values({ userId: u.id, kind: 'zzp', status: p.trust > 60 ? 'verified' : 'pending', provider: 'kvk', evidence: { kvkNumber: p.zzp.kvkNumber }, reviewedBy: p.trust > 60 ? admin.id : null, reviewedAt: p.trust > 60 ? now : null });
    await db.insert(s.verifications).values({ userId: u.id, kind: 'identity', status: p.trust > 60 ? 'verified' : 'pending', provider: 'manual', reviewedBy: p.trust > 60 ? admin.id : null, reviewedAt: p.trust > 60 ? now : null });
    for (const [i, h] of p.history.entries()) {
      await db.insert(s.workHistory).values({ profileId: row!.id, title: h.title, role: h.role, client: h.client, city: h.city, startDate: h.start, endDate: h.end, description: h.desc, sortOrder: i });
    }
  }

  // ── Projecten ────────────────────────────────────────────────────────────
  const projectDefs = [
    { company: 'Van Dijk Bouw B.V.', title: 'Timmerman nieuwbouw – 84 woningen Almere Poort', trade: 'timmerman', specialisms: ['aftimmering', 'kozijnen_en_deuren', 'woningbouw'], city: 'Almere', start: '2026-09-21', end: '2026-12-12', headcount: 4, hours: 40, minYears: 3, certs: ['vca_basis'], transport: true, tools: false, contract: 'either', rateMin: 45, rateMax: 50, status: 'published',
      description: 'Aftimmering van 84 grondgebonden woningen in Almere Poort. Je werkt in ploegen van vier onder een voorman. Kozijnen, binnendeuren, plinten en aftimmering. Werktijden 07:00 – 16:00, 40 uur per week. Opdrachtbevestiging vóór de start, wekelijkse urenregistratie via Timmerly, betaling binnen 14 dagen na goedkeuring.' },
    { company: 'Beter Wonen Onderhoud', title: 'Mutatietimmerman – doorlopend onderhoud Zwolle', trade: 'mutatietimmerman', specialisms: ['mutatiewerk', 'onderhoud'], city: 'Zwolle', start: '2026-09-10', end: null, headcount: 1, hours: 36, minYears: 2, certs: ['vca_basis'], transport: true, tools: true, contract: 'zzp', rateMin: 42, rateMax: 46, status: 'published',
      description: 'Doorlopend mutatieonderhoud voor een woningcorporatie in Zwolle. Zelfstandig werken met een eigen planning per week. Eigen bus en gereedschap vereist. Urenregistratie per adres.' },
    { company: 'Kroon Bouw & Infra', title: 'Betontimmerman – parkeergarage Utrecht', trade: 'betontimmerman', specialisms: ['betontimmerwerk', 'ruwbouw'], city: 'Utrecht', start: '2026-10-05', end: '2027-02-26', headcount: 6, hours: 45, minYears: 5, certs: ['vca_vol'], transport: false, tools: false, contract: 'zzp', rateMin: 50, rateMax: 54, status: 'published',
      description: 'Ruwbouw van een ondergrondse parkeergarage met 400 plaatsen. Bekisting, stelwerk en wapening plaatsen. Huisvesting in de buurt beschikbaar. Werktijden 06:30 – 16:00.' },
    { company: 'Van Dijk Bouw B.V.', title: 'Steltimmerman – 36 woningen Dronten', trade: 'timmerman', specialisms: ['stelwerk', 'nieuwbouw', 'houtskeletbouw'], city: 'Dronten', start: '2026-11-02', end: '2026-12-11', headcount: 3, hours: 40, minYears: 4, certs: ['vca_basis'], transport: true, tools: true, contract: 'either', rateMin: 46, rateMax: 50, status: 'published',
      description: 'Stelwerk voor 36 woningen in een nieuwbouwwijk. Ervaring met prefab houtskeletbouw is een pré. Werktijden 07:00 – 16:30.' },
    { company: 'Janssen Bouw', title: 'Kozijnen renovatie 12 woningen Deventer', trade: 'timmerman', specialisms: ['renovatie', 'kozijnen_en_deuren'], city: 'Deventer', start: '2026-09-28', end: '2026-11-06', headcount: 1, hours: 32, minYears: 3, certs: [], transport: true, tools: true, contract: 'zzp', rateMin: 44, rateMax: 48, status: 'in_review',
      description: 'Vervangen van houten kozijnen bij twaalf jaren-30-woningen. Onder leiding van onze uitvoerder.' },
    { company: 'Kroon Bouw & Infra', title: 'Afbouwtimmerman – kantoorpand Eindhoven', trade: 'timmerman', specialisms: ['afbouw', 'wanden_en_plafonds'], city: 'Eindhoven', start: '2026-09-14', end: '2026-11-06', headcount: 2, hours: 40, minYears: 3, certs: ['vca_basis'], transport: false, tools: false, contract: 'either', rateMin: 44, rateMax: 48, status: 'published',
      description: 'Afbouw van drie verdiepingen kantoorruimte: systeemwanden, plafonds en aftimmering. Strakke planning met oplevering eind november.' }
  ] as const;

  const projectIds: string[] = [];
  for (const p of projectDefs) {
    const existing = await db.query.projects.findFirst({ where: eq(s.projects.title, p.title) });
    if (existing) { projectIds.push(existing.id); continue; }
    const geo = geocode(p.city);
    const [row] = await db.insert(s.projects).values({
      companyId: companyIds[p.company]!, title: p.title, description: p.description, trade: p.trade, specialisms: [...p.specialisms], city: p.city, province: geo?.province,
      lat: geo?.lat, lng: geo?.lng, startDate: p.start, endDate: p.end, headcount: p.headcount, hoursPerWeek: p.hours, workingHours: '07:00 – 16:00', minYearsExperience: p.minYears,
      requiredCertificates: [...p.certs], requiresOwnTransport: p.transport, requiresOwnTools: p.tools, contractType: p.contract, rateMin: p.rateMin, rateMax: p.rateMax,
      housingAvailable: p.city === 'Utrecht', status: p.status, publishedAt: p.status === 'published' ? now : null
    }).returning();
    projectIds.push(row!.id);
  }

  // ── Een lopende opdracht met gesprek, uren en review ─────────────────────
  const daan = proIds['daan@verhoeventimmerwerken.nl']!;
  const almere = projectIds[0]!;
  const existingApp = await db.query.applications.findFirst({ where: eq(s.applications.projectId, almere) });
  if (!existingApp) {
    const [app] = await db.insert(s.applications).values({
      projectId: almere, profileId: daan.profileId, stage: 'active', initiatedBy: 'professional', matchScore: 96,
      matchReasons: [{ key: 'experience', label: '8 jaar ervaring (minimaal 3 gevraagd)', positive: true }, { key: 'distance', label: '50 km van het project', positive: true }, { key: 'certificates', label: 'VCA Basis geverifieerd', positive: true }],
      proposal: { hourlyRate: 47.5, contractType: 'zzp', startDate: '2026-09-21', endDate: '2026-12-12', hoursPerWeek: 40 }, agreedAt: now
    }).returning();
    const [conv] = await db.insert(s.conversations).values({ applicationId: app!.id, lastMessageAt: now }).returning();
    const vanDijkUser = (await db.query.users.findFirst({ where: eq(s.users.email, 'planning@vandijkbouw.nl') }))!;
    for (const m of [
      { sender: vanDijkUser.id, body: 'Hoi Daan, we starten 21 september met de aftimmering. Ben je dan vrij?' },
      { sender: daan.userId, body: 'Ja, vanaf 14 september ben ik beschikbaar. Werktijden 07:00–16:00?' },
      { sender: vanDijkUser.id, body: 'Klopt. Voorstel volgt met tarief €47,50 en 40 uur per week.' }
    ]) await db.insert(s.messages).values({ conversationId: conv!.id, senderId: m.sender, body: m.body, readAt: now });

    const [ts] = await db.insert(s.timesheets).values({ applicationId: app!.id, isoYear: 2026, isoWeek: 37, status: 'submitted', totalMinutes: 2310, submittedAt: now }).returning();
    const days = [['2026-09-07', '07:00', '16:00', 30, 510], ['2026-09-08', '07:00', '16:30', 30, 540], ['2026-09-09', '07:00', '16:00', 30, 510], ['2026-09-10', '07:00', '15:30', 30, 480], ['2026-09-11', '07:00', '12:00', 30, 270]] as const;
    for (const [day, st, en, br, min] of days) await db.insert(s.timesheetEntries).values({ timesheetId: ts!.id, day, startTime: st, endTime: en, breakMinutes: br, minutes: min });

    // Tweede aanmelding: Marijn op Zwolle, voorgesteld.
    await db.insert(s.applications).values({ projectId: projectIds[1]!, profileId: proIds['marijn@dewit.nl']!.profileId, stage: 'contact', initiatedBy: 'platform', matchScore: 91, matchReasons: [{ key: 'specialism', label: 'Mutatiewerk in profiel', positive: true }] });

    // Een afgeronde opdracht uit het verleden met reviews, voor het profiel van Daan.
    const [oldProject] = await db.insert(s.projects).values({
      companyId: companyIds['Beter Wonen Onderhoud']!, title: 'Mutatieonderhoud 80 woningen Kampen (afgerond)', description: 'Mutatiewerk en kleine renovaties, afgerond in 2024.', trade: 'mutatietimmerman', specialisms: ['mutatiewerk'], city: 'Kampen', startDate: '2024-06-03', endDate: '2024-11-01', headcount: 1, contractType: 'zzp', status: 'completed'
    }).returning();
    const [oldApp] = await db.insert(s.applications).values({ projectId: oldProject!.id, profileId: daan.profileId, stage: 'reviewed', initiatedBy: 'company', matchScore: 90, completedAt: new Date('2024-11-01') }).returning();
    const bwUser = (await db.query.users.findFirst({ where: eq(s.users.email, 'werk@beterwonenonderhoud.nl') }))!;
    await db.insert(s.reviews).values([
      { applicationId: oldApp!.id, direction: 'company_to_professional', authorId: bwUser.id, subjectId: daan.userId, scores: { vakmanschap: 5, betrouwbaarheid: 5, op_tijd: 5, communicatie: 4, kwaliteit: 5, zelfstandigheid: 5, veilig_werken: 5 }, overall: 49, comment: 'Nette oplevering en goede communicatie met de bewoners. Meldt problemen vroeg.' },
      { applicationId: oldApp!.id, direction: 'professional_to_company', authorId: daan.userId, subjectId: bwUser.id, scores: { communicatie: 5, betaling: 5, werkorganisatie: 4, werksfeer: 5, duidelijkheid: 4, materiaal: 4, planning: 4 }, overall: 44, comment: 'Duidelijke planning, betaling altijd op tijd.' }
    ]);

    await db.insert(s.notifications).values([
      { userId: daan.userId, type: 'match_found', title: 'Nieuw project past bij je profiel', body: 'Steltimmerman – 36 woningen Dronten, 84% match.', href: '/projecten' },
      { userId: daan.userId, type: 'certificate_expiring', title: 'Je VCA Basis verloopt over 30 dagen', body: 'Upload een nieuw certificaat om je verificatie te behouden.', href: '/profiel/certificaten' },
      { userId: vanDijkUser.id, type: 'timesheet', title: 'Uren ingediend: week 37', body: 'Daan Verhoeven heeft 38,5 uur ingediend voor Almere Poort.', href: '/uren' }
    ]);
    await db.insert(s.favorites).values({ ownerId: vanDijkUser.id, targetId: daan.userId, tag: 'Eerder ingezet' }).onConflictDoNothing();
    await db.insert(s.auditLog).values({ actorId: admin.id, actorRole: 'admin', action: 'certificate.verified', objectType: 'certificate', objectId: 'seed', after: { status: 'verified' } });
  }

  console.info('Seed klaar. Wachtwoord voor alle demo-accounts: ' + PASSWORD);
  await closeDb();
}

main().catch((err) => { console.error(err); process.exit(1); });
