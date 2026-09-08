import { desc, ilike, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole('admin', 'moderator');
  const { q } = await searchParams;
  const rows = await db().query.auditLog.findMany({ where: q ? ilike(schema.auditLog.action, `%${q}%`) : undefined, orderBy: desc(schema.auditLog.createdAt), limit: 200 });
  const actors = await db().query.users.findMany({ columns: { id: true, firstName: true, lastName: true } });
  const name = (id: string | null) => { const a = actors.find((x) => x.id === id); return a ? `${a.firstName} ${a.lastName}` : 'Systeem'; };
  return (
    <AppShell user={user} title="Auditlog" subtitle="Append-only: wie deed wat, wanneer, met welk object">
      <form method="get" className="mb-4 flex gap-2"><input name="q" className="input max-w-sm" placeholder="Filter op actie, bijv. certificate" defaultValue={q ?? ''} /><button className="btn-dark" type="submit">Filteren</button></form>
      <Card><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-faint"><th className="py-1 pr-3">Wanneer</th><th className="pr-3">Wie</th><th className="pr-3">Actie</th><th className="pr-3">Object</th><th>Wijziging</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-t border-line align-top"><td className="whitespace-nowrap py-2 pr-3">{r.createdAt.toLocaleString('nl-NL')}</td><td className="whitespace-nowrap pr-3">{name(r.actorId)}<span className="text-muted"> {r.actorRole ? `(${r.actorRole})` : ''}</span></td><td className="pr-3 font-semibold">{r.action}</td><td className="pr-3 text-muted">{r.objectType} {r.objectId.slice(0, 8)}</td><td className="font-mono text-xs text-muted">{r.before ? `van ${JSON.stringify(r.before)} ` : ''}{r.after ? `naar ${JSON.stringify(r.after)}` : ''}</td></tr>)}</tbody></table></div></Card>
    </AppShell>
  );
}
