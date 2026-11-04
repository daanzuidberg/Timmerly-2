'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne, schema } from '@timmerly/db';
import { z } from 'zod';
import { companyProfileSchema, emailSchema, EXPERIENCE_BANDS, geocode, phoneSchema, professionalProfileSchema, type ExperienceBand, type VerificationStatus } from '@timmerly/core';
import { db } from '../db';
import { audit } from '../audit';
import { notify } from '../notify';
import { requireRole, revokeAllSessions } from '../auth/session';
import { notifyMatches } from './projects';
import { refreshTrustScore } from './applications';
import { computeCompleteness } from './profile';
import { fieldErrors, formToObject, type ActionState } from './types';

/** Alle admin-acties: staf-rol vereist, alles in de auditlog, betrokkene krijgt een melding. */

export async function decideCertificate(certificateId: string, status: Extract<VerificationStatus, 'verified' | 'rejected'>, note: string): Promise<void> {
  const staff = await requireRole('admin', 'moderator');
  const d = db();
  const cert = await d.query.certificates.findFirst({ where: eq(schema.certificates.id, certificateId), with: { profile: true } });
  if (!cert) return;
  await d.update(schema.certificates).set({ status, reviewedBy: staff.id, reviewedAt: new Date(), reviewNote: note || null }).where(eq(schema.certificates.id, certificateId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: `certificate.${status}`, objectType: 'certificate', objectId: certificateId, before: { status: cert.status }, after: { status, note } });
  await notify(cert.profile.userId, { type: 'verification_result', title: status === 'verified' ? 'Je certificaat is geverifieerd' : 'Je certificaat is afgekeurd', body: note || (status === 'verified' ? 'Het certificaat telt nu volledig mee in je matches.' : 'Upload een leesbare kopie en probeer opnieuw.'), href: '/profiel/certificaten' });
  await computeCompleteness(cert.profileId);
  await refreshTrustScore(cert.profileId);
  revalidatePath('/admin/verificaties');
}

export async function decideVerification(verificationId: string, status: Extract<VerificationStatus, 'verified' | 'rejected'>, note: string): Promise<void> {
  const staff = await requireRole('admin', 'moderator');
  const d = db();
  const v = await d.query.verifications.findFirst({ where: eq(schema.verifications.id, verificationId) });
  if (!v) return;
  await d.update(schema.verifications).set({ status, reviewedBy: staff.id, reviewedAt: new Date(), note: note || null }).where(eq(schema.verifications.id, verificationId));
  if (v.kind === 'company') await d.update(schema.companyProfiles).set({ verifiedAt: status === 'verified' ? new Date() : null }).where(eq(schema.companyProfiles.userId, v.userId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: `verification.${v.kind}.${status}`, objectType: 'verification', objectId: verificationId, before: { status: v.status }, after: { status, note } });
  const labels: Record<string, string> = { identity: 'identiteit', company: 'bedrijf', zzp: 'ZZP-status', phone: 'telefoonnummer', email: 'e-mailadres', certificate: 'certificaat' };
  await notify(v.userId, { type: 'verification_result', title: status === 'verified' ? `Je ${labels[v.kind]} is geverifieerd` : `Verificatie van je ${labels[v.kind]} is afgekeurd`, body: note || '', href: v.kind === 'company' ? '/bedrijf' : '/profiel' });
  const profile = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.userId, v.userId) });
  if (profile) { await computeCompleteness(profile.id); await refreshTrustScore(profile.id); }
  revalidatePath('/admin/verificaties');
}

export async function reviewProject(projectId: string, decision: 'published' | 'draft' | 'removed', note: string): Promise<void> {
  const staff = await requireRole('admin', 'moderator');
  const d = db();
  const p = await d.query.projects.findFirst({ where: eq(schema.projects.id, projectId), with: { company: true } });
  if (!p) return;
  await d.update(schema.projects).set({ status: decision, publishedAt: decision === 'published' ? new Date() : p.publishedAt, reviewedBy: staff.id, reviewNote: note || null }).where(eq(schema.projects.id, projectId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: `project.review.${decision}`, objectType: 'project', objectId: projectId, before: { status: p.status }, after: { status: decision, note } });
  await notify(p.company.userId, { type: 'project_status', title: decision === 'published' ? 'Je project is gepubliceerd' : decision === 'removed' ? 'Je project is verwijderd' : 'Je project heeft aanpassingen nodig', body: note || p.title, href: `/mijn-projecten/${projectId}` });
  if (decision === 'published') await notifyMatches(projectId);
  revalidatePath('/admin/projecten'); revalidatePath('/projecten');
}

export async function setUserStatus(userId: string, status: 'active' | 'suspended', reason: string): Promise<void> {
  const staff = await requireRole('admin');
  const d = db();
  const u = await d.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!u || u.role === 'admin') return;
  await d.update(schema.users).set({ status }).where(eq(schema.users.id, userId));
  if (status === 'suspended') await revokeAllSessions(userId);
  await audit({ actorId: staff.id, actorRole: staff.role, action: `user.${status}`, objectType: 'user', objectId: userId, before: { status: u.status }, after: { status, reason } });
  revalidatePath('/admin/gebruikers');
}

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed', resolution: string): Promise<void> {
  const staff = await requireRole('admin', 'moderator');
  const d = db();
  const r = await d.query.reports.findFirst({ where: eq(schema.reports.id, reportId) });
  if (!r) return;
  await d.update(schema.reports).set({ status, handledBy: staff.id, resolution, resolvedAt: new Date() }).where(eq(schema.reports.id, reportId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: `report.${status}`, objectType: 'report', objectId: reportId, after: { resolution } });
  if (r.targetUserId) { const p = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.userId, r.targetUserId) }); if (p) await refreshTrustScore(p.id); }
  revalidatePath('/admin/meldingen');
}

export async function hideReview(reviewId: string, reason: string): Promise<void> {
  const staff = await requireRole('admin', 'moderator');
  const d = db();
  const r = await d.query.reviews.findFirst({ where: eq(schema.reviews.id, reviewId) });
  if (!r) return;
  await d.update(schema.reviews).set({ hiddenAt: r.hiddenAt ? null : new Date(), hiddenReason: r.hiddenAt ? null : reason }).where(eq(schema.reviews.id, reviewId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: r.hiddenAt ? 'review.unhidden' : 'review.hidden', objectType: 'review', objectId: reviewId, after: { reason } });
  revalidatePath('/admin/reviews');
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const staff = await requireRole('admin');
  const d = db();
  const before = await d.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  await d.insert(schema.settings).values({ key, value, updatedBy: staff.id }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedBy: staff.id } });
  await audit({ actorId: staff.id, actorRole: staff.role, action: 'setting.updated', objectType: 'setting', objectId: key, before: { value: before?.value ?? null }, after: { value } });
  revalidatePath('/admin/instellingen');
}

const adminUserSchema = z.object({
  firstName: z.string().trim().min(1, 'Vul een voornaam in').max(80),
  lastName: z.string().trim().min(1, 'Vul een achternaam in').max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal(''))
});

/** Zelfde afleiding als bij zelfregistratie: het bandje is intern, nooit apart ingevuld. */
function deriveExperienceBand(years: number): ExperienceBand {
  if (years <= 2) return EXPERIENCE_BANDS[0];
  if (years <= 5) return EXPERIENCE_BANDS[1];
  if (years <= 10) return EXPERIENCE_BANDS[2];
  return EXPERIENCE_BANDS[3];
}

/**
 * Admin kan accountgegevens van elke zzp'er of klant bewerken — nodig voor
 * support (typefout in naam/e-mail herstellen, telefoon aanpassen na contact).
 * Nooit op een ander admin-account, en elke wijziging gaat naar de auditlog.
 */
export async function adminUpdateUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const staff = await requireRole('admin');
  const raw = formToObject(form);
  const userId = String(raw.userId ?? '');
  const parsed = adminUserSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = db();
  const target = await d.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!target || target.role === 'admin') return { error: 'Dit account kan niet op deze manier bewerkt worden.' };
  const dup = await d.query.users.findFirst({ where: and(eq(schema.users.email, parsed.data.email), ne(schema.users.id, userId)) });
  if (dup) return { fieldErrors: { email: 'Dit e-mailadres is al bij een ander account in gebruik.' } };
  const after = { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email, phone: parsed.data.phone || null };
  await d.update(schema.users).set(after).where(eq(schema.users.id, userId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: 'user.updated_by_admin', objectType: 'user', objectId: userId, before: { firstName: target.firstName, lastName: target.lastName, email: target.email, phone: target.phone }, after });
  revalidatePath(`/admin/gebruikers/${userId}`); revalidatePath('/admin/gebruikers');
  return { ok: true };
}

/** Admin kan het volledige vakmanprofiel van een zzp'er bewerken (support, correcties na telefonisch contact). */
export async function adminUpdateProfessionalProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const staff = await requireRole('admin');
  const raw = formToObject(form);
  const userId = String(raw.userId ?? '');
  if (raw.yearsExperience !== undefined && raw.yearsExperience !== '') raw.experienceBand = deriveExperienceBand(Number(raw.yearsExperience));
  const parsed = professionalProfileSchema.safeParse({
    ...raw, specialisms: raw.specialisms ?? [], hasDriversLicense: raw.hasDriversLicense === 'on', hasOwnTransport: raw.hasOwnTransport === 'on', hasOwnTools: raw.hasOwnTools === 'on',
    hourlyRateMin: raw.hourlyRateMin === '' ? null : raw.hourlyRateMin, availableFrom: raw.availableFrom === '' ? null : raw.availableFrom
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const d = db();
  const profile = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.userId, userId) });
  if (!profile) return { error: 'Dit account heeft nog geen vakmanprofiel.' };
  const geo = geocode(v.city);
  const after = {
    trade: v.trade, specialisms: v.specialisms, experienceBand: v.experienceBand, yearsExperience: v.yearsExperience, bio: v.bio,
    city: v.city, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, maxTravelKm: v.maxTravelKm,
    hasDriversLicense: v.hasDriversLicense, hasOwnTransport: v.hasOwnTransport, hasOwnTools: v.hasOwnTools, workArrangement: v.workArrangement,
    hourlyRateMin: v.hourlyRateMin ?? null, hoursPerWeek: v.hoursPerWeek, availableFrom: v.availableFrom ?? null
  };
  await d.update(schema.professionalProfiles).set(after).where(eq(schema.professionalProfiles.id, profile.id));
  if (v.phone) await d.update(schema.users).set({ phone: v.phone }).where(eq(schema.users.id, userId));
  await audit({ actorId: staff.id, actorRole: staff.role, action: 'professional_profile.updated_by_admin', objectType: 'professional_profile', objectId: profile.id, before: { trade: profile.trade, city: profile.city, yearsExperience: profile.yearsExperience }, after: { trade: after.trade, city: after.city, yearsExperience: after.yearsExperience } });
  await computeCompleteness(profile.id);
  await refreshTrustScore(profile.id);
  revalidatePath(`/admin/gebruikers/${userId}`); revalidatePath('/admin/gebruikers');
  return { ok: true };
}

/** Admin kan het volledige bedrijfsprofiel van een klant bewerken (support, correcties na telefonisch contact). */
export async function adminUpdateCompanyProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const staff = await requireRole('admin');
  const raw = formToObject(form);
  const userId = String(raw.userId ?? '');
  const parsed = companyProfileSchema.safeParse({ ...raw, specialisms: raw.specialisms ?? [], employeeCount: raw.employeeCount === '' ? null : raw.employeeCount });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const d = db();
  const profile = await d.query.companyProfiles.findFirst({ where: eq(schema.companyProfiles.userId, userId) });
  if (!profile) return { error: 'Dit account heeft nog geen bedrijfsprofiel.' };
  const geo = geocode(v.city);
  const after = { name: v.name, kvkNumber: v.kvkNumber, website: v.website || null, phone: v.phone, city: v.city, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, companyType: v.companyType, description: v.description, specialisms: v.specialisms, employeeCount: v.employeeCount ?? null, workAreaKm: v.workAreaKm };
  await d.update(schema.companyProfiles).set(after).where(eq(schema.companyProfiles.id, profile.id));
  // KvK-nummer gewijzigd door admin: verificatie vervalt en gaat opnieuw in de wachtrij, net als bij de klant zelf.
  if (profile.kvkNumber !== v.kvkNumber) {
    await d.update(schema.companyProfiles).set({ verifiedAt: null }).where(eq(schema.companyProfiles.id, profile.id));
    await d.update(schema.verifications).set({ status: 'pending', reviewedAt: null }).where(and(eq(schema.verifications.userId, userId), eq(schema.verifications.kind, 'company')));
  }
  await audit({ actorId: staff.id, actorRole: staff.role, action: 'company_profile.updated_by_admin', objectType: 'company_profile', objectId: profile.id, before: { name: profile.name, kvkNumber: profile.kvkNumber, city: profile.city }, after: { name: after.name, kvkNumber: after.kvkNumber, city: after.city } });
  revalidatePath(`/admin/gebruikers/${userId}`); revalidatePath('/admin/gebruikers');
  return { ok: true };
}

export async function adminExists(): Promise<boolean> {
  return !!(await db().query.users.findFirst({ where: and(eq(schema.users.role, 'admin'), eq(schema.users.status, 'active')) }));
}
