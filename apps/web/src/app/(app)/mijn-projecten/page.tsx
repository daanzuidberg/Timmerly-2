import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, desc, eq, inArray, schema, count } from '@timmerly/db';
import { formatDateNl } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function MyProjects() {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf?nieuw=1');
  const d = db();
  const projects = await d.query.projects.findMany({ where: and(eq(schema.projects.companyId, company.id), eq(schema.projects.isTemplate, false)), orderBy: desc(schema.projects.createdAt) });
  const ids = projects.map((p) => p.id);
  const counts = ids.length ? await d.select({ projectId: schema.applications.projectId, n: count() }).from(schema.applications).where(inArray(schema.applications.projectId, ids)).groupBy(schema.applications.projectId) : [];
  return (
    <AppShell user={user} title="Mijn projecten" actions={<Link href="/projecten/nieuw" className="btn-primary btn-sm">Project plaatsen</Link>}>
      <Card>
        {projects.length ? <ul className="divide-y divide-line">{projects.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 py-3"><Link href={`/mijn-projecten/${p.id}`} className="min-w-0 font-semibold text-navy no-underline hover:text-orange-700"><span className="block truncate">{p.title}</span><span className="block text-sm font-normal text-muted">{p.city} · start {formatDateNl(p.startDate)} · {p.filledCount}/{p.headcount} ingevuld · {counts.find((c) => c.projectId === p.id)?.n ?? 0} kandidaten</span></Link><StatusPill status={p.status} /></li>)}</ul> : <Empty>Nog geen projecten.</Empty>}
      </Card>
    </AppShell>
  );
}
