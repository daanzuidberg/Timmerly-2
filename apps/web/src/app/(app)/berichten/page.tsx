import Link from 'next/link';
import { desc, eq, or, schema, and, isNull, ne, count } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await requireUser();
  const d = db();
  const rows = await d
    .select({ app: schema.applications, conv: schema.conversations, project: schema.projects, company: schema.companyProfiles, pro: schema.users, unread: count(schema.messages.id) })
    .from(schema.conversations)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.conversations.applicationId))
    .innerJoin(schema.projects, eq(schema.projects.id, schema.applications.projectId))
    .innerJoin(schema.companyProfiles, eq(schema.companyProfiles.id, schema.projects.companyId))
    .innerJoin(schema.professionalProfiles, eq(schema.professionalProfiles.id, schema.applications.profileId))
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .leftJoin(schema.messages, and(eq(schema.messages.conversationId, schema.conversations.id), isNull(schema.messages.readAt), ne(schema.messages.senderId, user.id)))
    .where(or(eq(schema.companyProfiles.userId, user.id), eq(schema.professionalProfiles.userId, user.id)))
    .groupBy(schema.applications.id, schema.conversations.id, schema.projects.id, schema.companyProfiles.id, schema.users.id)
    .orderBy(desc(schema.conversations.lastMessageAt));
  return (
    <AppShell user={user} title="Berichten" subtitle="Elk gesprek hoort bij een project">
      <Card>
        {rows.length ? <ul className="divide-y divide-line">{rows.map((r) => (
          <li key={r.app.id}><Link href={`/berichten/${r.app.id}`} className="flex items-center justify-between gap-3 py-3 no-underline">
            <div className="min-w-0"><div className="truncate font-bold text-navy">{user.role === 'company' ? `${r.pro.firstName} ${r.pro.lastName}` : r.company.name}{r.unread > 0 && <span className="ml-2 rounded-full bg-orange px-2 text-xs font-bold text-white">{r.unread}</span>}</div><div className="truncate text-sm text-muted">{r.project.title}</div></div>
            <StatusPill status={r.app.stage} />
          </Link></li>
        ))}</ul> : <Empty>Nog geen gesprekken. Die starten zodra er interesse is in een project.</Empty>}
      </Card>
    </AppShell>
  );
}
