import { desc, ilike, or, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { UserStatusButton } from '@/components/AdminActions';
import { Card, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole('admin');
  const { q } = await searchParams;
  const users = await db().query.users.findMany({ where: q ? or(ilike(schema.users.email, `%${q}%`), ilike(schema.users.lastName, `%${q}%`), ilike(schema.users.firstName, `%${q}%`)) : undefined, orderBy: desc(schema.users.createdAt), limit: 50 });
  return (
    <AppShell user={user} title="Gebruikers" subtitle="Blokkeren trekt alle sessies in en wordt vastgelegd">
      <form method="get" className="mb-4 flex gap-2"><input name="q" className="input max-w-sm" placeholder="Zoek op naam of e-mail" defaultValue={q ?? ''} /><button className="btn-dark" type="submit">Zoeken</button></form>
      <Card><ul className="divide-y divide-line text-sm">{users.map((u) => <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5"><div><div className="font-semibold">{u.firstName} {u.lastName} <span className="text-muted">· {u.role}</span></div><div className="text-muted">{u.email} · aangemaakt {u.createdAt.toLocaleDateString('nl-NL')}{u.lastLoginAt ? ` · laatst ingelogd ${u.lastLoginAt.toLocaleDateString('nl-NL')}` : ''} · risico {u.riskScore}</div></div><div className="flex items-center gap-3"><StatusPill status={u.status} />{u.role !== 'admin' && u.status !== 'deleted' && <UserStatusButton id={u.id} status={u.status} />}</div></li>)}</ul></Card>
    </AppShell>
  );
}
