'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, schema } from '@timmerly/db';
import { verifyPassword } from '@timmerly/auth';
import { notificationPrefsSchema, reportSchema } from '@timmerly/core';
import { db } from '../db';
import { audit } from '../audit';
import { destroySession, requireUser } from '../auth/session';
import { fieldErrors, formToObject, type ActionState } from './types';

export async function saveNotificationPrefs(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = notificationPrefsSchema.safeParse({ email: form.get('email') === 'on', push: form.get('push') === 'on', matchDigest: form.get('matchDigest') });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db().insert(schema.notificationPreferences).values({ userId: user.id, ...parsed.data }).onConflictDoUpdate({ target: schema.notificationPreferences.userId, set: parsed.data });
  revalidatePath('/instellingen');
  return { ok: true };
}

export async function markNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await db().update(schema.notifications).set({ readAt: new Date() }).where(eq(schema.notifications.userId, user.id));
  revalidatePath('/meldingen');
}

/** AVG: inzage en export van alle persoonsgegevens als JSON. */
export async function exportMyData(): Promise<string> {
  const user = await requireUser();
  const d = db();
  const row = await d.query.users.findFirst({
    where: eq(schema.users.id, user.id),
    columns: { passwordHash: false, totpSecretEnc: false },
    with: { professionalProfile: { with: { certificates: true, workHistory: true, availabilityDays: true, applications: { with: { project: { columns: { title: true, city: true } }, timesheets: { with: { entries: true } }, reviews: true } } } }, companyProfile: { with: { projects: true } }, verifications: true, notifications: true, sessions: { columns: { userAgent: true, ip: true, createdAt: true, lastSeenAt: true } } }
  });
  const reviewsWritten = await d.select().from(schema.reviews).where(eq(schema.reviews.authorId, user.id));
  const checks = await d.select().from(schema.complianceChecks).where(eq(schema.complianceChecks.userId, user.id));
  await audit({ actorId: user.id, actorRole: user.role, action: 'user.data_exported', objectType: 'user', objectId: user.id });
  return JSON.stringify({ exportedAt: new Date().toISOString(), account: row, reviewsWritten, complianceChecks: checks }, null, 2);
}

/**
 * AVG: account verwijderen. Persoonsgegevens worden direct geanonimiseerd;
 * het record blijft (zonder identificerende velden) zodat reviews, uren en
 * de auditlog van de wederpartij intact blijven (bewaarplicht en
 * verdedigingsbelang). Sessies worden ingetrokken.
 */
export async function deleteMyAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const d = db();
  const row = (await d.query.users.findFirst({ where: eq(schema.users.id, user.id) }))!;
  if (!(await verifyPassword(String(form.get('password') ?? ''), row.passwordHash))) return { error: 'Wachtwoord klopt niet.' };
  if (String(form.get('confirm')) !== 'VERWIJDER') return { error: 'Typ VERWIJDER om te bevestigen.' };
  const anon = `verwijderd-${user.id.slice(0, 8)}@anoniem.timmerly.nl`;
  await d.update(schema.users).set({ email: anon, firstName: 'Verwijderd', lastName: 'account', phone: null, passwordHash: 'deleted', totpSecretEnc: null, totpEnabledAt: null, status: 'deleted', deletedAt: new Date() }).where(eq(schema.users.id, user.id));
  await d.update(schema.professionalProfiles).set({ bio: '', city: '', lat: null, lng: null, zzp: null, visibility: { showCity: false, showRate: false, searchable: false } }).where(eq(schema.professionalProfiles.userId, user.id));
  await d.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await d.delete(schema.notifications).where(eq(schema.notifications.userId, user.id));
  await audit({ actorId: user.id, actorRole: user.role, action: 'user.deleted', objectType: 'user', objectId: user.id });
  await destroySession();
  redirect('/?verwijderd=1');
}

export async function submitReport(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = formToObject(form);
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const targetUserId = String(raw.targetUserId ?? '') || null;
  const targetProjectId = String(raw.targetProjectId ?? '') || null;
  if (!targetUserId && !targetProjectId) return { error: 'Onbekend doel van de melding.' };
  await db().insert(schema.reports).values({ reporterId: user.id, targetUserId, targetProjectId, reason: parsed.data.reason, description: parsed.data.description });
  await audit({ actorId: user.id, actorRole: user.role, action: 'report.created', objectType: targetUserId ? 'user' : 'project', objectId: targetUserId ?? targetProjectId!, after: { reason: parsed.data.reason } });
  return { ok: true };
}

export async function blockUser(targetUserId: string): Promise<void> {
  const user = await requireUser();
  await db().insert(schema.blocks).values({ blockerId: user.id, blockedId: targetUserId }).onConflictDoNothing();
  revalidatePath('/berichten');
}
