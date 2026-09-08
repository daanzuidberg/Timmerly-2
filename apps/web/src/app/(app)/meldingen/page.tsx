import Link from 'next/link';
import { desc, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { markNotificationsRead } from '@/lib/actions/settings';
import { AppShell } from '@/components/AppShell';
import { Card, Empty } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await db().query.notifications.findMany({ where: eq(schema.notifications.userId, user.id), orderBy: desc(schema.notifications.createdAt), limit: 50 });
  return (
    <AppShell user={user} title="Meldingen" actions={<form action={markNotificationsRead}><button className="btn-secondary btn-sm" type="submit">Alles gelezen</button></form>}>
      <Card>{items.length ? <ul className="divide-y divide-line">{items.map((n) => <li key={n.id} className={`flex gap-3 py-3 ${n.readAt ? 'opacity-70' : ''}`}><span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${n.readAt ? 'bg-line' : 'bg-orange'}`} /><div className="min-w-0 flex-1">{n.href ? <Link href={n.href} className="font-bold text-navy">{n.title}</Link> : <span className="font-bold">{n.title}</span>}{n.body && <div className="text-sm text-muted">{n.body}</div>}<div className="text-xs text-faint">{n.createdAt.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div></li>)}</ul> : <Empty>Geen meldingen.</Empty>}</Card>
    </AppShell>
  );
}
