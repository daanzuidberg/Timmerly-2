import Link from 'next/link';
import { desc, eq, schema } from '@timmerly/db';
import { formatDateNl } from '@timmerly/core';
import { screenProject } from '@timmerly/compliance';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { ProjectDecision } from '@/components/AdminActions';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminProjects() {
  const user = await requireRole('admin', 'moderator');
  const d = db();
  const review = await d.query.projects.findMany({ where: eq(schema.projects.status, 'in_review'), orderBy: desc(schema.projects.updatedAt), with: { company: true } });
  const recent = await d.query.projects.findMany({ where: eq(schema.projects.isTemplate, false), orderBy: desc(schema.projects.createdAt), limit: 30, with: { company: { columns: { name: true, verifiedAt: true } } } });
  return (
    <AppShell user={user} title="Projecten" subtitle="Beoordeling en overzicht">
      <div className="flex flex-col gap-5">
        <Card title={`Te beoordelen (${review.length})`}>
          {review.length ? <ul className="flex flex-col gap-4">{review.map((p) => { const hints = screenProject(p); return <li key={p.id} className="rounded-card border border-line p-4"><div className="flex flex-wrap justify-between gap-2"><div><Link href={`/projecten/${p.id}`} className="font-bold text-navy">{p.title}</Link><div className="text-sm text-muted">{p.company.name}{p.company.verifiedAt ? ' ✓' : ' (niet geverifieerd)'} · {p.city} · start {formatDateNl(p.startDate)} · {p.headcount} pers. · {p.contractType}</div></div></div><p className="mt-2 line-clamp-3 text-sm">{p.description}</p>{hints.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-warn-800">{hints.map((h) => <li key={h}>{h}</li>)}</ul>}<div className="mt-3"><ProjectDecision id={p.id} /></div></li>; })}</ul> : <Empty>Geen projecten in beoordeling.</Empty>}
        </Card>
        <Card title="Recent"><ul className="divide-y divide-line text-sm">{recent.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><Link href={`/projecten/${p.id}`} className="block truncate font-semibold text-navy">{p.title}</Link><span className="text-muted">{p.company.name} · {p.city} · {p.filledCount}/{p.headcount}</span></div><StatusPill status={p.status} /></li>)}</ul></Card>
      </div>
    </AppShell>
  );
}
