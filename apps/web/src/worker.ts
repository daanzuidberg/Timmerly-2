/**
 * Achtergrondworker: `pnpm --filter @timmerly/web worker`
 *
 * Verwerkt de jobs-tabel (e-mails, digests) en draait periodieke taken
 * (certificaatwaarschuwingen, verlopen certificaten, oude sessies). Eén proces
 * is genoeg tot ver voorbij de MVP; daarna is dit de plek voor BullMQ/Redis.
 */
import { and, eq, isNull, lte, lt, schema, sql } from '@timmerly/db';
import { addDays, todayIso, CERTIFICATE_LABELS, type CertificateType } from '@timmerly/core';
import { getDb } from '@timmerly/db';

const db = getDb();

async function processJobs() {
  const due = await db.select().from(schema.jobs).where(and(isNull(schema.jobs.completedAt), lte(schema.jobs.runAt, new Date()), lt(schema.jobs.attempts, 5))).limit(50);
  for (const job of due) {
    await db.update(schema.jobs).set({ lockedAt: new Date(), attempts: job.attempts + 1 }).where(eq(schema.jobs.id, job.id));
    try {
      if (job.type === 'email.notification') {
        const p = job.payload as { userId: string; title: string; body: string; href: string | null };
        const user = await db.query.users.findFirst({ where: eq(schema.users.id, p.userId) });
        if (user && user.status === 'active') console.info(`\n──── MAIL naar ${user.email} ────\n${p.title}\n\n${p.body}${p.href ? `\n${process.env.APP_URL ?? ''}${p.href}` : ''}\n`);
      }
      await db.update(schema.jobs).set({ completedAt: new Date() }).where(eq(schema.jobs.id, job.id));
    } catch (err) {
      await db.update(schema.jobs).set({ lastError: err instanceof Error ? err.message : String(err), runAt: new Date(Date.now() + 5 * 60_000) }).where(eq(schema.jobs.id, job.id));
    }
  }
  return due.length;
}

/** "Je VCA verloopt over 30 dagen" — één keer per certificaat. */
async function certificateExpiry() {
  const soon = addDays(todayIso(), 30);
  const expiring = await db.query.certificates.findMany({ where: and(eq(schema.certificates.status, 'verified'), lte(schema.certificates.expiresAt, soon), isNull(schema.certificates.expiryWarnedAt)), with: { profile: true } });
  for (const c of expiring) {
    await db.insert(schema.notifications).values({ userId: c.profile.userId, type: 'certificate_expiring', title: `Je ${CERTIFICATE_LABELS[c.type as CertificateType]} verloopt binnenkort`, body: `Geldig tot ${c.expiresAt}. Upload een nieuw certificaat om je verificatie te behouden.`, href: '/profiel/certificaten' });
    await db.insert(schema.jobs).values({ type: 'email.notification', payload: { userId: c.profile.userId, title: `Je ${CERTIFICATE_LABELS[c.type as CertificateType]} verloopt binnenkort`, body: `Geldig tot ${c.expiresAt}.`, href: '/profiel/certificaten' } });
    await db.update(schema.certificates).set({ expiryWarnedAt: new Date() }).where(eq(schema.certificates.id, c.id));
  }
  const expired = await db.update(schema.certificates).set({ status: 'expired' }).where(and(eq(schema.certificates.status, 'verified'), lt(schema.certificates.expiresAt, todayIso()))).returning({ id: schema.certificates.id });
  return { warned: expiring.length, expired: expired.length };
}

async function housekeeping() {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  await db.delete(schema.oneTimeTokens).where(lt(schema.oneTimeTokens.expiresAt, new Date()));
  await db.execute(sql`delete from security_events where created_at < now() - interval '12 months'`);
}

async function tick() {
  const jobs = await processJobs();
  const certs = await certificateExpiry();
  await housekeeping();
  if (jobs || certs.warned || certs.expired) console.info(`[worker] jobs=${jobs} certificaatwaarschuwingen=${certs.warned} verlopen=${certs.expired}`);
}

const once = process.argv.includes('--once');
tick().then(() => { if (once) process.exit(0); setInterval(() => tick().catch(console.error), 30_000); }).catch((err) => { console.error(err); process.exit(1); });
