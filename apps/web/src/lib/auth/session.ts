import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, schema } from '@timmerly/db';
import { generateToken, hashToken } from '@timmerly/auth';
import type { UserRole } from '@timmerly/core';
import { db } from '../db';
import { env } from '../env';
import { requestMeta } from '../request';

export const SESSION_COOKIE = 'tm_session';
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string; email: string; role: UserRole; firstName: string; lastName: string; emailVerified: boolean; totpEnabled: boolean; status: string;
  sessionId: string; mfaPassed: boolean;
};

/**
 * Sessie uit de cookie, één keer per request (React cache). De cookie bevat
 * een willekeurig token; de database bewaart alleen de hash. Verlopen of
 * ingetrokken sessies zijn dus direct ongeldig — anders dan bij JWT's.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const d = db();
  const row = await d
    .select({ s: schema.sessions, u: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, hashToken(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  const hit = row[0];
  if (!hit || hit.u.status !== 'active' || hit.u.deletedAt) return null;
  // lastSeenAt hooguit elke 5 minuten bijwerken (geen write per request).
  if (Date.now() - hit.s.lastSeenAt.getTime() > 5 * 60_000) {
    void d.update(schema.sessions).set({ lastSeenAt: new Date() }).where(eq(schema.sessions.id, hit.s.id));
  }
  return {
    id: hit.u.id, email: hit.u.email, role: hit.u.role, firstName: hit.u.firstName, lastName: hit.u.lastName,
    emailVerified: !!hit.u.emailVerifiedAt, totpEnabled: !!hit.u.totpEnabledAt, status: hit.u.status,
    sessionId: hit.s.id, mfaPassed: hit.s.mfaPassed
  };
});

export async function createSession(userId: string, opts: { mfaPassed: boolean }): Promise<void> {
  const token = generateToken();
  const { ip, userAgent } = await requestMeta();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db().insert(schema.sessions).values({ userId, tokenHash: hashToken(token), ip, userAgent, mfaPassed: opts.mfaPassed, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: env.isProd, path: '/', expires: expiresAt });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Alle sessies van een gebruiker intrekken (wachtwoordwijziging, blokkade). */
export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  const d = db();
  const rows = await d.select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.userId, userId));
  for (const r of rows) if (r.id !== exceptSessionId) await d.delete(schema.sessions).where(eq(schema.sessions.id, r.id));
}

/** Ingelogde gebruiker of doorsturen naar inloggen. Bij 2FA: eerst de code. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/inloggen');
  if (user.totpEnabled && !user.mfaPassed) redirect('/inloggen/tweestaps');
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}

export const isStaff = (role: UserRole) => role === 'admin' || role === 'moderator';
