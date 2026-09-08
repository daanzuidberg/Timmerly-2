import 'server-only';
import { schema } from '@timmerly/db';
import type { NotificationType } from '@timmerly/core';
import { db } from './db';

/**
 * In-app melding + (via voorkeuren) e-mail. De e-mail gaat als job de queue in;
 * de worker bundelt matchmeldingen tot een digest ("3 projecten die écht passen")
 * in plaats van per match een mail.
 */
export async function notify(userId: string, n: { type: NotificationType; title: string; body?: string; href?: string }): Promise<void> {
  const d = db();
  await d.insert(schema.notifications).values({ userId, type: n.type, title: n.title, body: n.body ?? '', href: n.href ?? null });
  const prefs = await d.query.notificationPreferences.findFirst({ where: (t, { eq }) => eq(t.userId, userId) });
  const wantsMail = prefs?.email ?? true;
  const digestable = n.type === 'match_found';
  if (wantsMail && !(digestable && prefs?.matchDigest !== 'instant')) {
    await d.insert(schema.jobs).values({ type: 'email.notification', payload: { userId, title: n.title, body: n.body ?? '', href: n.href ?? null } });
  }
}
