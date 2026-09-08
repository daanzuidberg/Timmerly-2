import Link from 'next/link';
import { and, count, eq, gte, inArray, schema, sql } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { Card, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Kerncijfers voor het team. Privacyvriendelijk: alleen tellingen, geen individuele profielen. */
export default async function AdminHome() {
  const user = await requireRole('admin', 'moderator');
  const d = db();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const n = async (q: Promise<Array<{ n: number }>>) => (await q)[0]?.n ?? 0;
  const [users, newUsers, pros, companies, projects, openProjects, apps, contacts, active, pendingVerif, pendingCerts, projectsToReview, openReports] = await Promise.all([
    n(d.select({ n: count() }).from(schema.users).where(eq(schema.users.status, 'active'))),
    n(d.select({ n: count() }).from(schema.users).where(gte(schema.users.createdAt, since30))),
    n(d.select({ n: count() }).from(schema.users).where(and(eq(schema.users.role, 'professional'), eq(schema.users.status, 'active')))),
    n(d.select({ n: count() }).from(schema.users).where(and(eq(schema.users.role, 'company'), eq(schema.users.status, 'active')))),
    n(d.select({ n: count() }).from(schema.projects).where(eq(schema.projects.isTemplate, false))),
    n(d.select({ n: count() }).from(schema.projects).where(inArray(schema.projects.status, ['published', 'matching']))),
    n(d.select({ n: count() }).from(schema.applications)),
    n(d.select({ n: count() }).from(schema.applications).where(inArray(schema.applications.stage, ['contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed']))),
    n(d.select({ n: count() }).from(schema.applications).where(inArray(schema.applications.stage, ['active', 'completed', 'reviewed']))),
    n(d.select({ n: count() }).from(schema.verifications).where(eq(schema.verifications.status, 'pending'))),
    n(d.select({ n: count() }).from(schema.certificates).where(eq(schema.certificates.status, 'pending'))),
    n(d.select({ n: count() }).from(schema.projects).where(eq(schema.projects.status, 'in_review'))),
    n(d.select({ n: count() }).from(schema.reports).where(eq(schema.reports.status, 'open')))
  ]);
  const regions = await d.select({ province: schema.projects.province, n: count() }).from(schema.projects).where(inArray(schema.projects.status, ['published', 'matching'])).groupBy(schema.projects.province).orderBy(sql`count(*) desc`).limit(6);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '—');
  return (
    <AppShell user={user} title="Beheer" subtitle={`Rol: ${user.role === 'admin' ? 'Admin · volledige toegang' : 'Moderator'}`}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Actieve gebruikers" value={users} hint={`${pros} vakmensen · ${companies} bedrijven · ${newUsers} nieuw in 30 dagen`} />
        <Stat label="Projecten" value={projects} hint={`${openProjects} open`} />
        <Stat label="Match → contact" value={pct(contacts, apps)} hint={`${contacts} van ${apps} aanmeldingen`} />
        <Stat label="Contact → opdracht" value={pct(active, contacts)} hint={`${active} opdrachten`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Werkvoorraad"><ul className="flex flex-col gap-2 text-sm">
          <li className="flex justify-between"><Link href="/admin/verificaties">Verificaties in behandeling</Link><strong>{pendingVerif}</strong></li>
          <li className="flex justify-between"><Link href="/admin/verificaties">Certificaten te controleren</Link><strong>{pendingCerts}</strong></li>
          <li className="flex justify-between"><Link href="/admin/projecten">Projecten te beoordelen</Link><strong>{projectsToReview}</strong></li>
          <li className="flex justify-between"><Link href="/admin/meldingen">Open meldingen</Link><strong>{openReports}</strong></li>
        </ul></Card>
        <Card title="Open projecten per provincie"><ul className="text-sm">{regions.map((r) => <li key={r.province ?? '-'} className="flex justify-between border-b border-line py-1.5 last:border-0"><span>{r.province ?? 'Onbekend'}</span><strong>{r.n}</strong></li>)}</ul></Card>
      </div>
    </AppShell>
  );
}
