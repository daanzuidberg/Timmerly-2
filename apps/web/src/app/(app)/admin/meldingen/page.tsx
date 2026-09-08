import Link from 'next/link';
import { desc, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { ReportDecision } from '@/components/AdminActions';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminReports() {
  const user = await requireRole('admin', 'moderator');
  const reports = await db().query.reports.findMany({ orderBy: desc(schema.reports.createdAt), limit: 50, with: { reporter: { columns: { firstName: true, lastName: true, email: true } }, targetUser: { columns: { id: true, firstName: true, lastName: true, email: true } }, targetProject: { columns: { id: true, title: true } } } });
  const open = reports.filter((r) => r.status === 'open');
  const done = reports.filter((r) => r.status !== 'open');
  const item = (r: (typeof reports)[number]) => (
    <li key={r.id} className="rounded-card border border-line p-4"><div className="flex flex-wrap justify-between gap-2"><div className="font-bold">{r.reason} · {r.targetUser ? <>{r.targetUser.firstName} {r.targetUser.lastName} ({r.targetUser.email})</> : r.targetProject ? <Link href={`/projecten/${r.targetProject.id}`}>{r.targetProject.title}</Link> : '—'}</div><StatusPill status={r.status} /></div><div className="text-sm text-muted">Gemeld door {r.reporter.firstName} {r.reporter.lastName} · {r.createdAt.toLocaleString('nl-NL')}</div><p className="mt-2 text-sm">{r.description}</p>{r.resolution && <p className="mt-1 text-sm"><strong>Afhandeling:</strong> {r.resolution}</p>}{r.status === 'open' && <div className="mt-3"><ReportDecision id={r.id} /></div>}</li>
  );
  return (
    <AppShell user={user} title="Meldingen" subtitle="Fraude, nepaccounts, ongewenst gedrag, onveilige situaties">
      <div className="flex flex-col gap-5"><Card title={`Open (${open.length})`}>{open.length ? <ul className="flex flex-col gap-4">{open.map(item)}</ul> : <Empty>Geen open meldingen.</Empty>}</Card><Card title="Afgehandeld"><ul className="flex flex-col gap-4">{done.map(item)}</ul></Card></div>
    </AppShell>
  );
}
