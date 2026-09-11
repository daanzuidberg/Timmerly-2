'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { certificateSchema, companyProfileSchema, geocode, professionalProfileSchema, zzpDetailsSchema, type AvailabilityStatus, type ProfessionalProfileInput } from '@timmerly/core';
import { db } from '../db';
import { audit } from '../audit';
import { requireRole, requireUser } from '../auth/session';
import { getCompanyProfile, getProfessionalProfile } from '../auth/profiles';
import { lookupKvk, namesRoughlyMatch } from '../kvk';
import { fieldErrors, formToObject, type ActionState } from './types';

/**
 * Zet wat het bedrijf zelf opgaf naast wat de KvK-Zoeken-API (indien
 * geconfigureerd) teruggeeft. Dit is alleen input voor de admin-beoordeling
 * op /admin/verificaties, geen automatische goed- of afkeuring — zie
 * lib/kvk.ts voor waarom.
 */
async function buildKvkEvidence(kvkNumber: string, name: string): Promise<Record<string, unknown>> {
  const match = await lookupKvk(kvkNumber);
  if (!match) return { kvkNumber, name };
  return { kvkNumber, name, kvkNaam: match.naam, kvkNaamKomtOvereen: namesRoughlyMatch(name, match.naam), kvkAdres: [match.straatnaam, match.huisnummer, match.postcode, match.plaats].filter(Boolean).join(' ') || undefined };
}

/** Profielvolledigheid: wat een aannemer nodig heeft om te kunnen kiezen. */
export async function computeCompleteness(profileId: string): Promise<number> {
  const d = db();
  const p = (await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.id, profileId), with: { certificates: true, workHistory: true, user: true } }))!;
  const checks: boolean[] = [
    !!p.trade, p.specialisms.length > 0, p.yearsExperience > 0, p.bio.length >= 40, !!p.city && p.lat != null, p.maxTravelKm > 0,
    p.certificates.length > 0, p.certificates.some((c) => c.status === 'verified'), p.workHistory.length > 0, !!p.user.phoneVerifiedAt,
    !!p.user.emailVerifiedAt, p.workArrangement !== 'zzp' || !!p.zzp, p.availableFrom != null || p.availability !== 'available'
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  await d.update(schema.professionalProfiles).set({ profileCompleteness: pct }).where(eq(schema.professionalProfiles.id, profileId));
  return pct;
}

/** Velden per onboardingsectie; 'all' valideert het volledige schema. */
const SECTION_MASKS = {
  work: { trade: true, specialisms: true, experienceBand: true, yearsExperience: true, bio: true, workArrangement: true, hourlyRateMin: true },
  person: { city: true, province: true, phone: true, maxTravelKm: true, hasDriversLicense: true, hasOwnTransport: true, hasOwnTools: true },
  availability: { availableFrom: true, hoursPerWeek: true }
} as const;

export async function saveProfessionalProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const raw = formToObject(form);
  const section = String(raw.section ?? 'all') as keyof typeof SECTION_MASKS | 'all';
  const schema_ = section === 'work' ? professionalProfileSchema.pick(SECTION_MASKS.work) : section === 'person' ? professionalProfileSchema.pick(SECTION_MASKS.person) : section === 'availability' ? professionalProfileSchema.pick(SECTION_MASKS.availability) : professionalProfileSchema;
  const parsed = schema_.safeParse({
    ...raw, specialisms: raw.specialisms ?? [], hasDriversLicense: raw.hasDriversLicense === 'on', hasOwnTransport: raw.hasOwnTransport === 'on', hasOwnTools: raw.hasOwnTools === 'on',
    hourlyRateMin: raw.hourlyRateMin === '' ? null : raw.hourlyRateMin, availableFrom: raw.availableFrom === '' ? null : raw.availableFrom
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data as Partial<ProfessionalProfileInput>;
  const d = db();
  const existing = await getProfessionalProfile(user.id);
  if (!existing && section !== 'work' && section !== 'all') redirect('/onboarding?stap=1');

  const values: Partial<typeof schema.professionalProfiles.$inferInsert> = {};
  if ('trade' in v) Object.assign(values, { trade: v.trade, specialisms: v.specialisms, experienceBand: v.experienceBand, yearsExperience: v.yearsExperience, bio: v.bio, workArrangement: v.workArrangement, hourlyRateMin: v.hourlyRateMin ?? null });
  if ('city' in v) {
    const geo = geocode(v.city!);
    Object.assign(values, { city: v.city, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, maxTravelKm: v.maxTravelKm, hasDriversLicense: v.hasDriversLicense, hasOwnTransport: v.hasOwnTransport, hasOwnTools: v.hasOwnTools });
    if (v.phone) await d.update(schema.users).set({ phone: v.phone }).where(eq(schema.users.id, user.id));
  }
  if ('hoursPerWeek' in v) Object.assign(values, { hoursPerWeek: v.hoursPerWeek, availableFrom: v.availableFrom ?? null });

  let profileId: string;
  if (existing) { await d.update(schema.professionalProfiles).set(values).where(eq(schema.professionalProfiles.id, existing.id)); profileId = existing.id; }
  else { const [row] = await d.insert(schema.professionalProfiles).values({ userId: user.id, trade: v.trade!, ...values, onboardingStep: 2 }).returning(); profileId = row!.id; }
  await computeCompleteness(profileId);
  revalidatePath('/profiel'); revalidatePath('/onboarding');
  const next = String(raw.next ?? '');
  if (next) redirect(next);
  return { ok: true };
}

export async function saveZzpDetails(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const raw = formToObject(form);
  const parsed = zzpDetailsSchema.safeParse({ ...raw, hasLiabilityInsurance: raw.hasLiabilityInsurance === 'on' });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const d = db();
  await d.update(schema.professionalProfiles).set({ zzp: { ...parsed.data, btwNumber: parsed.data.btwNumber || undefined } }).where(eq(schema.professionalProfiles.id, profile.id));
  // ZZP-verificatie: claim aanmaken (of opnieuw in behandeling zetten) voor het verificatieteam.
  const existing = await d.query.verifications.findFirst({ where: and(eq(schema.verifications.userId, user.id), eq(schema.verifications.kind, 'zzp')) });
  const evidence = { kvkNumber: parsed.data.kvkNumber, companyName: parsed.data.companyName, seat: parsed.data.seat, btwNumber: parsed.data.btwNumber || null };
  if (existing) await d.update(schema.verifications).set({ status: 'pending', evidence, reviewedAt: null, reviewedBy: null }).where(eq(schema.verifications.id, existing.id));
  else await d.insert(schema.verifications).values({ userId: user.id, kind: 'zzp', status: 'pending', provider: 'kvk', evidence });
  await computeCompleteness(profile.id);
  revalidatePath('/profiel');
  const next = String(raw.next ?? '');
  if (next) redirect(next);
  return { ok: true };
}

export async function addCertificate(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const raw = formToObject(form);
  const parsed = certificateSchema.safeParse({ ...raw, issuedAt: raw.issuedAt || null, expiresAt: raw.expiresAt || null });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  await db().insert(schema.certificates).values({ profileId: profile.id, ...parsed.data, status: 'pending' });
  await computeCompleteness(profile.id);
  revalidatePath('/profiel/certificaten');
  return { ok: true };
}

export async function removeCertificate(id: string): Promise<void> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) return;
  await db().delete(schema.certificates).where(and(eq(schema.certificates.id, id), eq(schema.certificates.profileId, profile.id)));
  await computeCompleteness(profile.id);
  revalidatePath('/profiel/certificaten');
}

export async function addWorkHistory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const title = String(form.get('title') ?? '').trim();
  if (title.length < 3) return { fieldErrors: { title: 'Vul een projectnaam in' } };
  await db().insert(schema.workHistory).values({
    profileId: profile.id, title, role: String(form.get('role') ?? ''), client: String(form.get('client') ?? ''), city: String(form.get('city') ?? ''),
    startDate: String(form.get('startDate') ?? '') || null, endDate: String(form.get('endDate') ?? '') || null, description: String(form.get('description') ?? '')
  });
  await computeCompleteness(profile.id);
  revalidatePath('/profiel');
  return { ok: true };
}

export async function removeWorkHistory(id: string): Promise<void> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) return;
  await db().delete(schema.workHistory).where(and(eq(schema.workHistory.id, id), eq(schema.workHistory.profileId, profile.id)));
  revalidatePath('/profiel');
}

export async function completeOnboarding(): Promise<void> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  await db().update(schema.professionalProfiles).set({ onboardingCompletedAt: new Date(), onboardingStep: 6 }).where(eq(schema.professionalProfiles.id, profile.id));
  await db().insert(schema.verifications).values({ userId: user.id, kind: 'identity', status: 'pending', provider: 'manual' }).onConflictDoNothing();
  await audit({ actorId: user.id, actorRole: 'professional', action: 'profile.onboarding_completed', objectType: 'professional_profile', objectId: profile.id });
  redirect('/dashboard?welkom=1');
}

export async function setAvailability(status: AvailabilityStatus): Promise<void> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) return;
  await db().update(schema.professionalProfiles).set({ availability: status }).where(eq(schema.professionalProfiles.id, profile.id));
  revalidatePath('/dashboard'); revalidatePath('/profiel/beschikbaarheid');
}

export async function setAvailabilityDay(day: string, status: AvailabilityStatus | 'default'): Promise<void> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const d = db();
  if (status === 'default') await d.delete(schema.availabilityDays).where(and(eq(schema.availabilityDays.profileId, profile.id), eq(schema.availabilityDays.day, day)));
  else await d.insert(schema.availabilityDays).values({ profileId: profile.id, day, status }).onConflictDoUpdate({ target: [schema.availabilityDays.profileId, schema.availabilityDays.day], set: { status } });
  revalidatePath('/profiel/beschikbaarheid');
}

export async function saveVisibility(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  await db().update(schema.professionalProfiles).set({ visibility: { showCity: form.get('showCity') === 'on', showRate: form.get('showRate') === 'on', searchable: form.get('searchable') === 'on' } }).where(eq(schema.professionalProfiles.id, profile.id));
  revalidatePath('/instellingen');
  return { ok: true };
}

export async function saveCompanyProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('company');
  const raw = formToObject(form);
  const parsed = companyProfileSchema.safeParse({ ...raw, specialisms: raw.specialisms ?? [], employeeCount: raw.employeeCount === '' ? null : raw.employeeCount });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const geo = geocode(v.city);
  const d = db();
  const existing = await getCompanyProfile(user.id);
  const values = { name: v.name, kvkNumber: v.kvkNumber, website: v.website || null, phone: v.phone, city: v.city, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, companyType: v.companyType, description: v.description, specialisms: v.specialisms, employeeCount: v.employeeCount ?? null, workAreaKm: v.workAreaKm };
  const kvkEvidence = await buildKvkEvidence(v.kvkNumber, v.name);
  if (existing) {
    await d.update(schema.companyProfiles).set(values).where(eq(schema.companyProfiles.id, existing.id));
    if (existing.kvkNumber !== v.kvkNumber) {
      // KvK gewijzigd: verificatie vervalt en gaat opnieuw de wachtrij in.
      await d.update(schema.companyProfiles).set({ verifiedAt: null }).where(eq(schema.companyProfiles.id, existing.id));
      await d.update(schema.verifications).set({ status: 'pending', evidence: kvkEvidence, reviewedAt: null }).where(and(eq(schema.verifications.userId, user.id), eq(schema.verifications.kind, 'company')));
    }
  } else {
    await d.insert(schema.companyProfiles).values({ userId: user.id, ...values, onboardingCompletedAt: new Date() });
    await d.insert(schema.verifications).values({ userId: user.id, kind: 'company', status: 'pending', provider: 'kvk', evidence: kvkEvidence });
    await d.update(schema.users).set({ phone: v.phone }).where(eq(schema.users.id, user.id));
    await audit({ actorId: user.id, actorRole: 'company', action: 'company.created', objectType: 'company_profile', objectId: user.id, after: { kvkNumber: v.kvkNumber } });
  }
  revalidatePath('/bedrijf'); revalidatePath('/dashboard');
  const next = String(raw.next ?? '');
  if (next) redirect(next);
  return { ok: true };
}

export async function toggleFavorite(targetUserId: string, tag?: string): Promise<void> {
  const user = await requireUser();
  const d = db();
  const existing = await d.query.favorites.findFirst({ where: and(eq(schema.favorites.ownerId, user.id), eq(schema.favorites.targetId, targetUserId)) });
  if (existing) await d.delete(schema.favorites).where(and(eq(schema.favorites.ownerId, user.id), eq(schema.favorites.targetId, targetUserId)));
  else await d.insert(schema.favorites).values({ ownerId: user.id, targetId: targetUserId, tag: tag ?? null });
  revalidatePath('/favorieten'); revalidatePath('/vakmensen');
}

export async function toggleSavedProject(projectId: string): Promise<void> {
  const user = await requireUser();
  const d = db();
  const existing = await d.query.savedProjects.findFirst({ where: and(eq(schema.savedProjects.userId, user.id), eq(schema.savedProjects.projectId, projectId)) });
  if (existing) await d.delete(schema.savedProjects).where(and(eq(schema.savedProjects.userId, user.id), eq(schema.savedProjects.projectId, projectId)));
  else await d.insert(schema.savedProjects).values({ userId: user.id, projectId });
  revalidatePath(`/projecten/${projectId}`); revalidatePath('/favorieten');
}
