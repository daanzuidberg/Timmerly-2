import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, desc, eq, schema } from '@timmerly/db';
import { TRADE_LABELS, formatDateNl, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { candidatesForProject } from '@/lib/matching';
import { complianceHints } from '@/lib/actions/projects';
import { AppShell } from '@/components/AppShell';
import { InviteButton, ProjectStatusActions, ProposalForm, StageActions } from '@/components/CandidateActions';
import { Alert, Avatar, Card, Empty, Reasons, Score, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ProjectManage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nieuw?: string }> }) {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf');
  const { id } = await params;
  const { nieuw } = await searchParams;
  const d = db();
  const project = await d.query.projects.findFirst({ where: and(eq(schema.projects.id, id), eq(schema.projects.companyId, company.id)) });
  if (!project) notFound();
  const apps = await d.query.applications.findMany({ where: eq(schema.applications.projectId, id), orderBy: desc(schema.applications.updatedAt), with: { profile: { with: { user: { columns: { id: true, firstName: true, lastName: true } } } } } });
  const suggestions = ['published', 'matching', 'draft', 'in_review'].includes(project.status) ? await candidatesForProject(project, 8) : [];
  const appliedProfileIds = new Set(apps.map((a) => a.profileId));
  const hints = await complianceHints(id);
  const open = apps.filter((a) => !['declined', 'withdrawn', 'completed', 'reviewed'].includes(a.stage));

  return (
    <AppShell user={user} title={project.title} subtitle={`${project.city} · start ${formatDateNl(project.startDate)} · ${project.filledCount}/${project.headcount} ingevuld`} actions={<Link href={`/mijn-projecten/${id}/bewerken`} className="btn-secondary btn-sm">Bewerken</Link>}>
      {nieuw && <div className="mb-5"><Alert tone="ok"><strong>Project opgeslagen als concept.</strong> Controleer hieronder de gegevens en {company.verifiedAt ? 'publiceer' : 'dien in ter beoordeling'}.</Alert></div>}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusPill status={project.status} />
        <ProjectStatusActions projectId={id} status={project.status} verified={!!company.verifiedAt} />
        {project.reviewNote && <span className="text-sm text-muted">Opmerking beoordelaar: {project.reviewNote}</span>}
      </div>
      {hints.length > 0 && project.contractType !== 'employment' && (
        <div className="mb-5"><Alert tone="warn"><strong>ZZP-signalering.</strong> Deze opdracht bevat kenmerken die extra aandacht vragen bij de kwalificatie van de arbeidsrelatie:<ul className="mt-1 list-disc pl-5">{hints.map((h) => <li key={h}>{h}</li>)}</ul><Link href="/zzp-check" className="mt-1 inline-block font-bold">Doe de ZZP-check</Link> — geen juridisch advies.</Alert></div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title={`Kandidaten (${open.length})`}>
          {apps.length ? (
            <ul className="flex flex-col gap-4">{apps.map((a) => (
              <li key={a.id} className="rounded-card border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><Avatar name={`${a.profile.user.firstName} ${a.profile.user.lastName}`} /><div><Link href={`/vakmensen/${a.profile.id}`} className="font-bold text-navy">{a.profile.user.firstName} {a.profile.user.lastName}</Link><div className="text-sm text-muted">{TRADE_LABELS[a.profile.trade as Trade]} · {a.profile.city} · {a.profile.yearsExperience} jaar</div></div></div>
                  <div className="flex items-center gap-3">{a.matchScore != null && <Score value={a.matchScore} size="sm" />}<StatusPill status={a.stage} /></div>
                </div>
                {a.matchReasons.length > 0 && <div className="mt-3"><Reasons reasons={a.matchReasons} max={4} /></div>}
                {a.proposal && <div className="mt-3 rounded-card bg-ground p-3 text-sm"><strong>Voorstel:</strong> €{a.proposal.hourlyRate}/u · {a.proposal.hoursPerWeek} u/week · {a.proposal.contractType === 'zzp' ? 'ZZP' : 'loondienst'} · start {formatDateNl(a.proposal.startDate)}{a.agreedAt ? ' · akkoord' : ''}</div>}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link href={`/berichten/${a.id}`} className="btn-secondary btn-sm">Gesprek</Link>
                  {a.stage === 'active' && <Link href={`/uren/${a.id}`} className="btn-secondary btn-sm">Uren</Link>}
                  {['completed', 'reviewed'].includes(a.stage) && <Link href={`/beoordelen/${a.id}`} className="btn-secondary btn-sm">Beoordelen</Link>}
                  <StageActions applicationId={a.id} stage={a.stage} role="company" />
                </div>
                {a.stage === 'contact' && <details className="mt-3"><summary className="cursor-pointer text-sm font-bold text-orange-700">Voorstel opstellen</summary><div className="mt-3"><ProposalForm applicationId={a.id} defaults={{ hourlyRate: a.profile.hourlyRateMin ?? project.rateMax, hoursPerWeek: project.hoursPerWeek, startDate: project.startDate, endDate: project.endDate, contractType: project.contractType }} /></div></details>}
              </li>
            ))}</ul>
          ) : <Empty>Nog geen kandidaten. {project.status === 'draft' ? 'Publiceer het project om interesse te ontvangen.' : 'Benader vakmensen uit de suggesties hiernaast.'}</Empty>}
        </Card>

        <Card title="Smart Match · beste kandidaten" action={<span className="text-xs text-faint">gerangschikt op profiel, afstand, certificaten en beschikbaarheid</span>}>
          {suggestions.length ? (
            <ul className="flex flex-col gap-3">{suggestions.map((s, i) => (
              <li key={s.profile.id} className="flex items-start gap-3 rounded-card border border-line p-3">
                <span className="w-5 text-sm font-bold text-faint">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><Link href={`/vakmensen/${s.profile.id}`} className="truncate font-bold text-navy">{TRADE_LABELS[s.profile.trade as Trade]} · {s.profile.city}</Link><Score value={s.match.score} size="sm" /></div>
                  <div className="mt-1 text-sm text-muted">{s.match.reasons.filter((r) => r.positive).slice(0, 3).map((r) => r.label).join(' · ')}</div>
                  <div className="mt-2"><InviteButton projectId={id} profileId={s.profile.id} invited={appliedProfileIds.has(s.profile.id)} /></div>
                </div>
              </li>
            ))}</ul>
          ) : <Empty>Geen geschikte kandidaten gevonden. Verruim de eisen of het werkgebied.</Empty>}
          <p className="mt-3 text-xs text-faint">Namen worden zichtbaar zodra een vakman reageert of jij hem benadert.</p>
        </Card>
      </div>
    </AppShell>
  );
}
