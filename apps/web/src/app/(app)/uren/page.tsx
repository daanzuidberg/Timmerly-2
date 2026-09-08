import Link from 'next/link';
import { desc, eq, or, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HoursOverview() {
  const user = await requireUser();
  const d = db();
  const rows = await d
    .select({ ts: schema.timesheets, app: schema.applications, project: schema.projects, pro: schema.users })
    .from(schema.timesheets)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.timesheets.applicationId))
    .innerJoin(schema.projects, eq(schema.projects.id, schema.applications.projectId))
    .innerJoin(schema.companyProfiles, eq(schema.companyProfiles.id, schema.projects.companyId))
    .innerJoin(schema.professionalProfiles, eq(schema.professionalProfiles.id, schema.applications.profileId))
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(or(eq(schema.companyProfiles.userId, user.id), eq(schema.professionalProfiles.userId, user.id)))
    .orderBy(desc(schema.timesheets.isoYear), desc(schema.timesheets.isoWeek));
  const active = await d.select({ app: schema.applications, project: schema.projects }).from(schema.applications).innerJoin(schema.projects, eq(schema.projects.id, schema.applications.projectId)).innerJoin(schema.professionalProfiles, eq(schema.professionalProfiles.id, schema.applications.profileId)).innerJoin(schema.companyProfiles, eq(schema.companyProfiles.id, schema.projects.companyId)).where(or(eq(schema.companyProfiles.userId, user.id), eq(schema.professionalProfiles.userId, user.id)));
  const activeApps = active.filter((a) => a.app.stage === 'active');
  return (
    <AppShell user={user} title={user.role === 'company' ? 'Uren goedkeuren' : 'Urenregistratie'} subtitle="Per week indienen, goedkeuren of afwijzen met reden">
      {activeApps.length > 0 && <div className="mb-5 flex flex-wrap gap-2">{activeApps.map((a) => <Link key={a.app.id} href={`/uren/${a.app.id}`} className="btn-secondary btn-sm">{a.project.title}</Link>)}</div>}
      <Card title="Weekstaten">
        {rows.length ? <ul className="divide-y divide-line">{rows.map((r) => <li key={r.ts.id}><Link href={`/uren/${r.app.id}`} className="flex items-center justify-between gap-3 py-3 no-underline"><div><div className="font-bold text-navy">Week {r.ts.isoWeek} · {r.project.title}</div><div className="text-sm text-muted">{user.role === 'company' ? `${r.pro.firstName} ${r.pro.lastName} · ` : ''}{(r.ts.totalMinutes / 60).toFixed(1).replace('.', ',')} uur</div></div><StatusPill status={r.ts.status} /></Link></li>)}</ul> : <Empty>Nog geen urenstaten. {user.role === 'professional' ? 'Uren invoeren kan zodra een opdracht loopt.' : ''}</Empty>}
      </Card>
    </AppShell>
  );
}
