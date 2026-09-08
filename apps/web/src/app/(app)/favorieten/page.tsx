import Link from 'next/link';
import { desc, eq, schema } from '@timmerly/db';
import { TRADE_LABELS, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { toggleFavorite } from '@/lib/actions/profile';
import { AppShell } from '@/components/AppShell';
import { ProjectCard } from '@/components/ProjectCard';
import { Avatar, Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const user = await requireUser();
  const d = db();
  if (user.role === 'company') {
    const favs = await d.query.favorites.findMany({ where: eq(schema.favorites.ownerId, user.id), orderBy: desc(schema.favorites.createdAt), with: { target: { with: { professionalProfile: true } } } });
    return (
      <AppShell user={user} title="Talentpool" subtitle="Vakmensen die je hebt opgeslagen of eerder inzette">
        <Card>{favs.length ? <ul className="divide-y divide-line">{favs.map((f) => { const p = f.target.professionalProfile; return <li key={f.targetId} className="flex items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><Avatar name={`${f.target.firstName} ${f.target.lastName}`} /><div>{p ? <Link href={`/vakmensen/${p.id}`} className="font-bold text-navy">{f.target.firstName} {f.target.lastName}</Link> : <span className="font-bold">{f.target.firstName} {f.target.lastName}</span>}<div className="text-sm text-muted">{p ? `${TRADE_LABELS[p.trade as Trade]} · ${p.city}` : ''}{f.tag ? ` · ${f.tag}` : ''}</div></div></div><div className="flex items-center gap-2">{p && <StatusPill status={p.availability} />}<form action={toggleFavorite.bind(null, f.targetId, undefined)}><button className="btn-ghost btn-sm" type="submit">Verwijderen</button></form></div></li>; })}</ul> : <Empty>Nog leeg. Sla vakmensen op vanuit <Link href="/vakmensen">Vakmensen zoeken</Link> of een project.</Empty>}</Card>
      </AppShell>
    );
  }
  const saved = await d.query.savedProjects.findMany({ where: eq(schema.savedProjects.userId, user.id), orderBy: desc(schema.savedProjects.createdAt), with: { project: { with: { company: { columns: { name: true, verifiedAt: true } } } } } });
  return (
    <AppShell user={user} title="Opgeslagen projecten">
      {saved.length ? <div className="grid gap-4 md:grid-cols-3">{saved.map((s) => <ProjectCard key={s.projectId} project={s.project} />)}</div> : <Empty>Nog geen opgeslagen projecten.</Empty>}
    </AppShell>
  );
}
