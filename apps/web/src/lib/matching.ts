import 'server-only';
import { and, eq, inArray, isNull, schema, sql } from '@timmerly/db';
import type { CertificateType, ContractType, WorkArrangement } from '@timmerly/core';
import { rankProfessionals, rankProjects, scoreMatch, type MatchWeights, type ProfessionalFacts, type ProjectFacts } from '@timmerly/matching';
import { db } from './db';

type ProfileRow = typeof schema.professionalProfiles.$inferSelect;
type ProjectRow = typeof schema.projects.$inferSelect;

/** Vertaalt databaserijen naar de platte feiten die de engine verwacht. */
export async function professionalFacts(profiles: ProfileRow[]): Promise<ProfessionalFacts[]> {
  if (profiles.length === 0) return [];
  const d = db();
  const ids = profiles.map((p) => p.id);
  const userIds = profiles.map((p) => p.userId);
  const certs = await d.select().from(schema.certificates).where(inArray(schema.certificates.profileId, ids));
  const reviews = await d
    .select({ subjectId: schema.reviews.subjectId, avg: sql<number>`avg(${schema.reviews.overall})::float / 10`, n: sql<number>`count(*)::int` })
    .from(schema.reviews).where(and(inArray(schema.reviews.subjectId, userIds), isNull(schema.reviews.hiddenAt))).groupBy(schema.reviews.subjectId);
  const completed = await d
    .select({ profileId: schema.applications.profileId, n: sql<number>`count(*)::int`, companies: sql<string[]>`array_agg(distinct ${schema.projects.companyId})` })
    .from(schema.applications).innerJoin(schema.projects, eq(schema.projects.id, schema.applications.projectId))
    .where(and(inArray(schema.applications.profileId, ids), inArray(schema.applications.stage, ['completed', 'reviewed', 'active'])))
    .groupBy(schema.applications.profileId);

  return profiles.map((p) => {
    const rev = reviews.find((r) => r.subjectId === p.userId);
    const done = completed.find((c) => c.profileId === p.id);
    return {
      id: p.id, trade: p.trade, specialisms: p.specialisms, yearsExperience: p.yearsExperience,
      location: p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null, maxTravelKm: p.maxTravelKm,
      certificates: certs.filter((c) => c.profileId === p.id).map((c) => ({ type: c.type as CertificateType, verified: c.status === 'verified', expiresAt: c.expiresAt })),
      hasDriversLicense: p.hasDriversLicense, hasOwnTransport: p.hasOwnTransport, hasOwnTools: p.hasOwnTools, workArrangement: p.workArrangement as WorkArrangement,
      hourlyRateMin: p.hourlyRateMin, availability: p.availability, availableFrom: p.availableFrom, hoursPerWeek: p.hoursPerWeek,
      trustScore: p.trustScore, reviewAverage: rev ? Number(rev.avg) : null, completedProjects: done?.n ?? 0, workedForCompanyIds: done?.companies ?? []
    };
  });
}

export function projectFacts(p: ProjectRow): ProjectFacts {
  return {
    id: p.id, companyId: p.companyId, trade: p.trade, specialisms: p.specialisms, location: p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null,
    startDate: p.startDate, minYearsExperience: p.minYearsExperience, requiredCertificates: p.requiredCertificates as CertificateType[],
    requiresOwnTransport: p.requiresOwnTransport, requiresOwnTools: p.requiresOwnTools, contractType: p.contractType as ContractType,
    rateMin: p.rateMin, rateMax: p.rateMax, hoursPerWeek: p.hoursPerWeek
  };
}

/** Gewichten uit de settings-tabel; standaard uit de engine als ze ontbreken. */
export async function matchWeights(): Promise<Partial<MatchWeights> | undefined> {
  const row = await db().query.settings.findFirst({ where: eq(schema.settings.key, 'matching.weights') });
  return (row?.value as Partial<MatchWeights> | undefined) ?? undefined;
}

/** Beste kandidaten voor een project: alleen zoekbare, actieve profielen met afgeronde onboarding. */
export async function candidatesForProject(project: ProjectRow, limit = 20) {
  const d = db();
  const profiles = await d
    .select({ p: schema.professionalProfiles })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(and(eq(schema.users.status, 'active'), sql`${schema.professionalProfiles.onboardingCompletedAt} is not null`, sql`(${schema.professionalProfiles.visibility}->>'searchable')::boolean`));
  const facts = await professionalFacts(profiles.map((r) => r.p));
  const weights = await matchWeights();
  const ranked = rankProfessionals(projectFacts(project), facts, { weights });
  return ranked.slice(0, limit).map((r) => ({ profile: profiles.find((x) => x.p.id === r.pro.id)!.p, match: r.match }));
}

/** Passende projecten voor een vakman, gerangschikt. */
export async function projectsForProfessional(profile: ProfileRow, projects: ProjectRow[]) {
  const [facts] = await professionalFacts([profile]);
  const weights = await matchWeights();
  return rankProjects(facts!, projects.map(projectFacts), { weights }).map((r) => ({ project: projects.find((p) => p.id === r.project.id)!, match: r.match }));
}

export async function scoreFor(profile: ProfileRow, project: ProjectRow) {
  const [facts] = await professionalFacts([profile]);
  return scoreMatch(facts!, projectFacts(project), { weights: await matchWeights() });
}
