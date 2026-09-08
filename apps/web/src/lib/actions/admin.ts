'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, schema } from '@timmerly/db';
import type { VerificationStatus } from '@timmerly/core';
import { db } from '../db';
import { audit } from '../audit';
import { notify } from '../notify';
import { requireRole, revokeAllSessions } from '../auth/session';
import { notifyMatches } from './projects';
import { refreshTrustScore } from './applications';
import { computeCompleteness } from './profile';

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
  await notify(v.userId, { type: 'verification_result', title: status === 'verified' ? `Je ${labels[v.kind]} is geverifieerd` : `Verificatie van je ${labels[v.kind]} is afgekeurd`, body: note || '', href: '/profiel' });
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

export async function adminExists(): Promise<boolean> {
  return !!(await db().query.users.findFirst({ where: and(eq(schema.users.role, 'admin'), eq(schema.users.status, 'active')) }));
}
