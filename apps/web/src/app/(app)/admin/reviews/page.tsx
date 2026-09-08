import { desc, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { ReviewHideButton } from '@/components/AdminActions';
import { Card, Pill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminReviews() {
  const user = await requireRole('admin', 'moderator');
  const reviews = await db().query.reviews.findMany({ orderBy: desc(schema.reviews.createdAt), limit: 50, with: { author: { columns: { firstName: true, lastName: true } }, subject: { columns: { firstName: true, lastName: true } }, application: { with: { project: { columns: { title: true } } } } } });
  return (
    <AppShell user={user} title="Reviews" subtitle="Moderatie: verborgen reviews tellen niet mee in scores">
      <Card><ul className="divide-y divide-line">{reviews.map((r) => <li key={r.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm"><strong>{r.author.firstName} {r.author.lastName}</strong> over <strong>{r.subject.firstName} {r.subject.lastName}</strong> · {r.application.project.title} · <span className="font-bold text-orange-700">{(r.overall / 10).toFixed(1).replace('.', ',')}</span>{r.hiddenAt && <Pill tone="bad"> verborgen</Pill>}</div><ReviewHideButton id={r.id} hidden={!!r.hiddenAt} /></div><p className="mt-1 text-sm">{r.comment}</p>{r.hiddenReason && <p className="text-xs text-muted">Reden: {r.hiddenReason}</p>}</li>)}</ul></Card>
    </AppShell>
  );
}
