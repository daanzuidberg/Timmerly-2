'use server';

import { redirect } from 'next/navigation';
import { and, eq, gt, isNull, schema } from '@timmerly/db';
import { decryptSecret, encryptSecret, generateToken, generateTotpSecret, hashPassword, hashToken, needsRehash, totpUri, verifyPassword, verifyTotp } from '@timmerly/auth';
import { emailSchema, loginSchema, passwordSchema, registerSchema } from '@timmerly/core';
import { createHash } from 'node:crypto';
import { db } from '../db';
import { env } from '../env';
import { passwordResetMail, sendMail, verificationMail } from '../mail';
import { rateLimit } from '../rate-limit';
import { requestMeta } from '../request';
import { audit } from '../audit';
import { createSession, destroySession, getSession, requireUser, revokeAllSessions } from '../auth/session';
import { fieldErrors, formToObject, type ActionState } from './types';

// Lazy: env.SESSION_SECRET pas opeisen bij het eerste gebruik, niet bij het
// importeren van deze module (Next.js evalueert routemodules tijdens de
// build om hun exports te lezen, ook zonder request of .env aanwezig).
let totpKey: Buffer | undefined;
function getTotpKey(): Buffer {
  return (totpKey ??= createHash('sha256').update(env.SESSION_SECRET + ':totp').digest());
}

async function securityEvent(userId: string | null, type: string) {
  const { ip, userAgent } = await requestMeta();
  await db().insert(schema.securityEvents).values({ userId, type, ip, userAgent });
}

export async function register(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = formToObject(form);
  const parsed = registerSchema.safeParse({ ...raw, acceptTerms: raw.acceptTerms === 'on' ? true : raw.acceptTerms });
  const values = { email: String(raw.email ?? ''), firstName: String(raw.firstName ?? ''), lastName: String(raw.lastName ?? ''), role: String(raw.role ?? 'professional') };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { ip } = await requestMeta();
  if (!rateLimit(`register:${ip}`, { capacity: 5, refillPerMinute: 1 }).ok) return { error: 'Te veel pogingen. Probeer het over een paar minuten opnieuw.', values };

  const d = db();
  const existing = await d.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  if (existing) {
    // Geen e-mailenumeratie: zelfde uitkomst, maar de bestaande gebruiker krijgt een mail.
    await sendMail({ to: parsed.data.email, subject: 'Je hebt al een Timmerly-account', text: 'Iemand probeerde met dit e-mailadres een account aan te maken. Je hebt al een account: log in of stel je wachtwoord opnieuw in.' });
    redirect('/registreren/bevestig');
  }

  const [user] = await d.insert(schema.users).values({
    email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: parsed.data.role,
    firstName: parsed.data.firstName, lastName: parsed.data.lastName, termsAcceptedAt: new Date()
  }).returning();
  await d.insert(schema.notificationPreferences).values({ userId: user!.id });
  await d.insert(schema.verifications).values({ userId: user!.id, kind: 'email', status: 'pending', provider: 'internal' });

  const token = generateToken();
  await d.insert(schema.oneTimeTokens).values({ userId: user!.id, purpose: 'verify_email', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 3600_000) });
  await sendMail(verificationMail(parsed.data.email, token));
  await securityEvent(user!.id, 'registered');
  await audit({ actorId: user!.id, actorRole: user!.role, action: 'user.registered', objectType: 'user', objectId: user!.id, after: { role: user!.role } });
  await createSession(user!.id, { mfaPassed: true });
  redirect('/registreren/bevestig');
}

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = formToObject(form);
  const parsed = loginSchema.safeParse(raw);
  const values = { email: String(raw.email ?? '') };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { ip } = await requestMeta();
  if (!rateLimit(`login:${ip}`, { capacity: 10, refillPerMinute: 2 }).ok) return { error: 'Te veel inlogpogingen. Wacht even en probeer opnieuw.', values };
  if (!rateLimit(`login:${parsed.data.email}`, { capacity: 8, refillPerMinute: 1 }).ok) return { error: 'Te veel inlogpogingen voor dit account. Wacht even en probeer opnieuw.', values };

  const d = db();
  const user = await d.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  const generic = { error: 'E-mailadres of wachtwoord klopt niet.', values };
  if (!user || user.deletedAt) { await securityEvent(null, 'login_failed'); return generic; }
  if (user.lockedUntil && user.lockedUntil > new Date()) return { error: 'Dit account is tijdelijk vergrendeld na te veel mislukte pogingen. Probeer het over 15 minuten opnieuw.', values };
  if (user.status !== 'active') return { error: 'Dit account is geblokkeerd. Neem contact op met support@timmerly.nl.', values };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await d.update(schema.users).set({ failedLoginCount: failed, lockedUntil: failed >= 8 ? new Date(Date.now() + 15 * 60_000) : null }).where(eq(schema.users.id, user.id));
    await securityEvent(user.id, 'login_failed');
    return generic;
  }
  if (needsRehash(user.passwordHash)) await d.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(schema.users.id, user.id));
  await d.update(schema.users).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await securityEvent(user.id, 'login_ok');
  await createSession(user.id, { mfaPassed: !user.totpEnabledAt });
  redirect(user.totpEnabledAt ? '/inloggen/tweestaps' : user.role === 'admin' || user.role === 'moderator' ? '/admin' : '/dashboard');
}

export async function verifyTwoFactor(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect('/inloggen');
  const code = String(form.get('code') ?? '');
  const { ip } = await requestMeta();
  if (!rateLimit(`totp:${session.id}:${ip}`, { capacity: 6, refillPerMinute: 1 }).ok) return { error: 'Te veel pogingen. Wacht even.' };
  const user = await db().query.users.findFirst({ where: eq(schema.users.id, session.id) });
  if (!user?.totpSecretEnc) redirect('/dashboard');
  if (!verifyTotp(decryptSecret(user.totpSecretEnc, getTotpKey()), code)) { await securityEvent(user.id, 'mfa_failed'); return { error: 'De code klopt niet. Controleer de tijd op je telefoon en probeer opnieuw.' }; }
  await db().update(schema.sessions).set({ mfaPassed: true }).where(eq(schema.sessions.id, session.sessionId));
  await securityEvent(user.id, 'mfa_ok');
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/');
}

export async function verifyEmail(token: string): Promise<'ok' | 'invalid'> {
  const d = db();
  const row = await d.query.oneTimeTokens.findFirst({ where: and(eq(schema.oneTimeTokens.tokenHash, hashToken(token)), eq(schema.oneTimeTokens.purpose, 'verify_email'), isNull(schema.oneTimeTokens.usedAt), gt(schema.oneTimeTokens.expiresAt, new Date())) });
  if (!row) return 'invalid';
  await d.update(schema.oneTimeTokens).set({ usedAt: new Date() }).where(eq(schema.oneTimeTokens.id, row.id));
  await d.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, row.userId));
  await d.update(schema.verifications).set({ status: 'verified', reviewedAt: new Date() }).where(and(eq(schema.verifications.userId, row.userId), eq(schema.verifications.kind, 'email')));
  return 'ok';
}

export async function resendVerification(): Promise<ActionState> {
  const user = await requireUser();
  if (user.emailVerified) return { ok: true };
  const { ip } = await requestMeta();
  if (!rateLimit(`resend:${user.id}:${ip}`, { capacity: 3, refillPerMinute: 0.5 }).ok) return { error: 'Je hebt net een mail ontvangen. Kijk ook in je spamfolder.' };
  const token = generateToken();
  await db().insert(schema.oneTimeTokens).values({ userId: user.id, purpose: 'verify_email', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 3600_000) });
  await sendMail(verificationMail(user.email, token));
  return { ok: true };
}

export async function requestPasswordReset(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(form.get('email'));
  if (!email.success) return { fieldErrors: { email: email.error.issues[0]!.message } };
  const { ip } = await requestMeta();
  if (!rateLimit(`reset:${ip}`, { capacity: 5, refillPerMinute: 1 }).ok) return { error: 'Te veel aanvragen. Probeer het later opnieuw.' };
  const user = await db().query.users.findFirst({ where: eq(schema.users.email, email.data) });
  if (user && !user.deletedAt) {
    const token = generateToken();
    await db().insert(schema.oneTimeTokens).values({ userId: user.id, purpose: 'reset_password', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) });
    await sendMail(passwordResetMail(user.email, token));
    await securityEvent(user.id, 'password_reset_requested');
  }
  return { ok: true }; // zelfde antwoord of het adres bestaat of niet
}

export async function resetPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const token = String(form.get('token') ?? '');
  const pw = passwordSchema.safeParse(form.get('password'));
  if (!pw.success) return { fieldErrors: { password: pw.error.issues[0]!.message } };
  const d = db();
  const row = await d.query.oneTimeTokens.findFirst({ where: and(eq(schema.oneTimeTokens.tokenHash, hashToken(token)), eq(schema.oneTimeTokens.purpose, 'reset_password'), isNull(schema.oneTimeTokens.usedAt), gt(schema.oneTimeTokens.expiresAt, new Date())) });
  if (!row) return { error: 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.' };
  await d.update(schema.oneTimeTokens).set({ usedAt: new Date() }).where(eq(schema.oneTimeTokens.id, row.id));
  await d.update(schema.users).set({ passwordHash: await hashPassword(pw.data), failedLoginCount: 0, lockedUntil: null }).where(eq(schema.users.id, row.userId));
  await revokeAllSessions(row.userId);
  await securityEvent(row.userId, 'password_changed');
  redirect('/inloggen?reset=ok');
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(form.get('current') ?? '');
  const next = passwordSchema.safeParse(form.get('password'));
  if (!next.success) return { fieldErrors: { password: next.error.issues[0]!.message } };
  const row = (await db().query.users.findFirst({ where: eq(schema.users.id, user.id) }))!;
  if (!(await verifyPassword(current, row.passwordHash))) return { fieldErrors: { current: 'Huidig wachtwoord klopt niet' } };
  await db().update(schema.users).set({ passwordHash: await hashPassword(next.data) }).where(eq(schema.users.id, user.id));
  await revokeAllSessions(user.id, user.sessionId);
  await securityEvent(user.id, 'password_changed');
  return { ok: true };
}

/** Stap 1 van 2FA: geheim aanmaken en (versleuteld) opslaan, nog niet actief. */
export async function beginTotpSetup(): Promise<{ secret: string; uri: string }> {
  const user = await requireUser();
  const secret = generateTotpSecret();
  await db().update(schema.users).set({ totpSecretEnc: encryptSecret(secret, getTotpKey()), totpEnabledAt: null }).where(eq(schema.users.id, user.id));
  return { secret, uri: totpUri(secret, user.email) };
}

/** Stap 2: eerste code bevestigen, dan pas actief. */
export async function confirmTotp(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const row = (await db().query.users.findFirst({ where: eq(schema.users.id, user.id) }))!;
  if (!row.totpSecretEnc) return { error: 'Start de instelling opnieuw.' };
  if (!verifyTotp(decryptSecret(row.totpSecretEnc, getTotpKey()), String(form.get('code') ?? ''))) return { error: 'De code klopt niet. Scan de QR-code opnieuw en probeer het nog eens.' };
  await db().update(schema.users).set({ totpEnabledAt: new Date() }).where(eq(schema.users.id, user.id));
  await db().update(schema.sessions).set({ mfaPassed: true }).where(eq(schema.sessions.id, user.sessionId));
  await securityEvent(user.id, 'mfa_enabled');
  await audit({ actorId: user.id, actorRole: user.role, action: 'user.mfa_enabled', objectType: 'user', objectId: user.id });
  return { ok: true };
}

export async function disableTotp(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const row = (await db().query.users.findFirst({ where: eq(schema.users.id, user.id) }))!;
  if (!(await verifyPassword(String(form.get('password') ?? ''), row.passwordHash))) return { error: 'Wachtwoord klopt niet.' };
  await db().update(schema.users).set({ totpSecretEnc: null, totpEnabledAt: null }).where(eq(schema.users.id, user.id));
  await securityEvent(user.id, 'mfa_disabled');
  return { ok: true };
}

export async function revokeSession(sessionId: string): Promise<void> {
  const user = await requireUser();
  await db().delete(schema.sessions).where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.userId, user.id)));
  await securityEvent(user.id, 'session_revoked');
}
