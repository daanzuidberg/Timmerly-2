import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq, schema } from '@timmerly/db';
import { formatDateNl } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { StageActions } from '@/components/CandidateActions';
import { Card, Empty, Reasons, Score, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const apps = await db().query.applications.findMany({ where: eq(schema.applications.profileId, profile.id), orderBy: desc(schema.applications.updatedAt), with: { project: { with: { company: { columns: { name: true, verifiedAt: true } } } } } });
  const STEPS = ['interest', 'contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed'];
  return (
    <AppShell user={user} title="Mijn aanmeldingen" subtitle="Van interesse tot review, per project">
      {apps.length ? <div className="flex flex-col gap-4">{apps.map((a) => { const idx = STEPS.indexOf(a.stage); return (
        <Card key={a.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><Link href={`/projecten/${a.projectId}`} className="text-lg font-bold text-navy">{a.project.title}</Link><div className="text-sm text-muted">{a.project.company.name}{a.project.company.verifiedAt ? ' ✓' : ''} · {a.project.city} · start {formatDateNl(a.proposal?.startDate ?? a.project.startDate)}</div></div>
            <div className="flex items-center gap-3">{a.matchScore != null && <Score value={a.matchScore} size="sm" />}<StatusPill status={a.stage} /></div>
          </div>
          {idx >= 0 && <ol className="mt-4 flex flex-wrap gap-1.5">{STEPS.slice(0, 6).map((s, i) => <li key={s} className={`rounded-[3px] px-2.5 py-1 text-xs font-bold ${i < idx ? 'bg-ok-100 text-ok-800' : i === idx ? 'bg-orange text-white' : 'bg-ground text-faint'}`}>{['Interesse', 'Contact', 'Voorstel', 'Akkoord', 'Opdracht', 'Afgerond'][i]}</li>)}</ol>}
          {a.proposal && <div className="mt-3 rounded-card bg-ground p-3 text-sm"><strong>Voorstel:</strong> €{a.proposal.hourlyRate}/u · {a.proposal.hoursPerWeek} u/week · {a.proposal.contractType === 'zzp' ? 'ZZP' : 'loondienst'} · {formatDateNl(a.proposal.startDate)}{a.proposal.endDate ? ` – ${formatDateNl(a.proposal.endDate)}` : ''}{a.proposal.notes ? ` · ${a.proposal.notes}` : ''}{a.proposal.contractType === 'zzp' && a.stage === 'proposal' && <> · <Link href="/zzp-check">Doe de ZZP-check</Link></>}</div>}
          {a.matchReasons.length > 0 && a.stage === 'interest' && <div className="mt-3"><Reasons reasons={a.matchReasons} max={4} /></div>}
          {a.declineReason && <p className="mt-2 text-sm text-muted">Reden: {a.declineReason}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`/berichten/${a.id}`} className="btn-secondary btn-sm">Gesprek</Link>
            {a.stage === 'active' && <Link href={`/uren/${a.id}`} className="btn-primary btn-sm">Uren invoeren</Link>}
            {['completed', 'reviewed'].includes(a.stage) && <Link href={`/beoordelen/${a.id}`} className="btn-secondary btn-sm">Opdrachtgever beoordelen</Link>}
            <StageActions applicationId={a.id} stage={a.stage} role="pro" />
          </div>
        </Card>
      ); })}</div> : <Empty>Nog geen aanmeldingen. <Link href="/projecten">Bekijk projecten die bij je passen</Link>.</Empty>}
    </AppShell>
  );
}
