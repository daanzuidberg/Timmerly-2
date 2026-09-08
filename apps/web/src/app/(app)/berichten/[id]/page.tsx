import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq, schema } from '@timmerly/db';
import { formatDateNl } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { loadApplication, markConversationRead } from '@/lib/actions/applications';
import { AppShell } from '@/components/AppShell';
import { ChatBox } from '@/components/ChatBox';
import { ProposalForm, StageActions } from '@/components/CandidateActions';
import { Card, Reasons, Score, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id, user);
  if (!loaded) notFound();
  const { app, isPro, isCompany } = loaded;
  await markConversationRead(id);
  const msgs = app.conversation ? await db().query.messages.findMany({ where: eq(schema.messages.conversationId, app.conversation.id), orderBy: asc(schema.messages.createdAt), with: { sender: { columns: { firstName: true, lastName: true } } } }) : [];
  const other = isPro ? app.project.company.name : `${app.profile.user.firstName} ${app.profile.user.lastName}`;
  const closed = ['declined', 'withdrawn'].includes(app.stage);
  return (
    <AppShell user={user} title={other} subtitle={app.project.title} actions={<StatusPill status={app.stage} />}>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card><ChatBox applicationId={id} closed={closed || loaded.isStaff} messages={msgs.map((m) => ({ id: m.id, body: m.body, kind: m.kind, mine: m.senderId === user.id, who: m.kind === 'system' ? 'Timmerly' : `${m.sender.firstName}`, at: m.createdAt.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }))} /></Card>
        <div className="flex flex-col gap-5">
          <Card title="Project">
            <div className="text-sm"><Link href={isCompany ? `/mijn-projecten/${app.projectId}` : `/projecten/${app.projectId}`} className="font-bold">{app.project.title}</Link><div className="text-muted">{app.project.city} · start {formatDateNl(app.project.startDate)} · {app.project.hoursPerWeek} u/week</div></div>
            {app.matchScore != null && <div className="mt-3 flex items-start gap-3"><Score value={app.matchScore} size="sm" /><div className="flex-1"><Reasons reasons={app.matchReasons} max={3} /></div></div>}
          </Card>
          {app.proposal && <Card title="Voorstel"><div className="text-sm">€{app.proposal.hourlyRate}/u · {app.proposal.hoursPerWeek} u/week · {app.proposal.contractType === 'zzp' ? 'ZZP' : 'loondienst'}<br />{formatDateNl(app.proposal.startDate)}{app.proposal.endDate ? ` – ${formatDateNl(app.proposal.endDate)}` : ''}{app.proposal.notes ? <><br />{app.proposal.notes}</> : null}{app.agreedAt && <div className="mt-1 font-bold text-ok-800">Akkoord op {formatDateNl(app.agreedAt.toISOString())}</div>}</div></Card>}
          <Card title="Volgende stap">
            <StageActions applicationId={id} stage={app.stage} role={isPro ? 'pro' : 'company'} />
            {isCompany && app.stage === 'contact' && <div className="mt-3"><ProposalForm applicationId={id} defaults={{ hourlyRate: app.profile.hourlyRateMin ?? app.project.rateMax, hoursPerWeek: app.project.hoursPerWeek, startDate: app.project.startDate, endDate: app.project.endDate, contractType: app.project.contractType }} /></div>}
            {app.stage === 'active' && <Link href={`/uren/${id}`} className="btn-secondary btn-sm mt-2">Uren</Link>}
            {['completed', 'reviewed'].includes(app.stage) && <Link href={`/beoordelen/${id}`} className="btn-secondary btn-sm mt-2">Beoordelen</Link>}
            {!closed && app.stage !== 'active' && !['completed', 'reviewed'].includes(app.stage) && <p className="mt-2 text-xs text-faint">{isPro ? 'Het bedrijf stuurt een voorstel; jij accepteert of stelt vragen.' : 'Open het gesprek, stuur een voorstel, start de opdracht na akkoord.'}</p>}
          </Card>
          <Card title="Veilig samenwerken"><p className="text-xs text-muted">Houd afspraken in dit gesprek; zo blijft alles bij het project. Iets niet in orde? <Link href={`/melden?user=${isPro ? app.project.company.userId : app.profile.userId}`}>Meld het</Link>.</p></Card>
        </div>
      </div>
    </AppShell>
  );
}
