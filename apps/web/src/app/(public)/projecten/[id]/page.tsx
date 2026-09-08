import { notFound } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { CERTIFICATE_LABELS, CONTRACT_TYPE_LABELS, SPECIALISM_LABELS, TRADE_LABELS, formatDateNl, type CertificateType, type ContractType, type Specialism, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { scoreFor } from '@/lib/matching';
import { InterestButton } from '@/components/InterestButton';
import { Pill, Reasons, Score } from '@/components/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db().query.projects.findFirst({ where: eq(schema.projects.id, id), columns: { title: true, city: true, description: true } });
  return p ? { title: `${p.title} · ${p.city}`, description: p.description.slice(0, 160) } : { title: 'Project' };
}

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db().query.projects.findFirst({ where: eq(schema.projects.id, id), with: { company: true } });
  if (!project || !['published', 'matching', 'filled'].includes(project.status)) notFound();
  const session = await getSession();
  const profile = session?.role === 'professional' ? await getProfessionalProfile(session.id) : null;
  const match = profile?.onboardingCompletedAt ? await scoreFor(profile, project) : null;
  const application = profile ? await db().query.applications.findFirst({ where: and(eq(schema.applications.projectId, id), eq(schema.applications.profileId, profile.id)) }) : null;
  const saved = session ? !!(await db().query.savedProjects.findFirst({ where: and(eq(schema.savedProjects.userId, session.id), eq(schema.savedProjects.projectId, id)) })) : false;
  const spots = project.headcount - project.filledCount;

  const facts = [
    ['Locatie', `${project.city}${project.province ? `, ${project.province}` : ''}`], ['Start', formatDateNl(project.startDate)], ['Duur', project.endDate ? `tot ${formatDateNl(project.endDate)}` : 'Doorlopend'],
    ['Vakgebied', TRADE_LABELS[project.trade as Trade] ?? project.trade], ['Uren', `${project.hoursPerWeek} u/week${project.workingHours ? ` · ${project.workingHours}` : ''}`], ['Contract', CONTRACT_TYPE_LABELS[project.contractType as ContractType]],
    ['Ervaring', project.minYearsExperience ? `Minimaal ${project.minYearsExperience} jaar` : 'Geen minimum'], ['Certificaten', project.requiredCertificates.length ? project.requiredCertificates.map((c) => CERTIFICATE_LABELS[c as CertificateType]).join(', ') : 'Niet vereist'],
    ['Vervoer', project.requiresOwnTransport ? 'Eigen vervoer vereist' : 'Niet vereist'], ['Gereedschap', project.requiresOwnTools ? 'Eigen gereedschap' : 'Door opdrachtgever'],
    ['Huisvesting', project.housingAvailable ? 'Beschikbaar' : 'Niet van toepassing'], ['Reiskosten', project.travelAllowance || 'In overleg']
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/projecten" className="text-sm font-bold">← Alle projecten</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {project.status === 'filled' ? <Pill tone="info">Ingevuld</Pill> : <Pill tone={spots <= 1 ? 'warn' : 'ok'}>{spots <= 1 ? 'Bijna vol' : 'Open'}</Pill>}
            <span className="text-sm text-muted">Geplaatst {formatDateNl(project.publishedAt?.toISOString() ?? project.createdAt.toISOString())}</span>
          </div>
          <h1 className="h1 mt-3">{project.title}</h1>
          <p className="mt-2 text-muted">{project.company.name}{project.company.verifiedAt ? ' · Bedrijf geverifieerd ✓' : ''} · {project.headcount} {project.headcount === 1 ? 'persoon' : 'personen'} gezocht</p>
          <div className="mt-4 flex flex-wrap gap-1.5">{project.specialisms.map((s) => <span key={s} className="rounded-[3px] border border-line bg-ground px-2.5 py-1 text-xs font-bold">{SPECIALISM_LABELS[s as Specialism] ?? s}</span>)}</div>

          {match && (
            <section className="card mt-8 flex items-start gap-5">
              <Score value={match.score} size="lg" />
              <div className="flex-1">
                <div className="mb-2 font-bold">Waarom dit project bij je past</div>
                <Reasons reasons={match.reasons} />
              </div>
            </section>
          )}

          <section className="mt-8"><h2 className="h3 mb-2">Over het project</h2><p className="whitespace-pre-line text-[15px] leading-relaxed">{project.description}</p></section>
          {project.notes && <section className="mt-6"><h2 className="h3 mb-2">Bijzonderheden</h2><p className="whitespace-pre-line text-[15px]">{project.notes}</p></section>}
          <section className="mt-8">
            <h2 className="h3 mb-3">Eisen en voorwaarden</h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{facts.map(([k, v]) => <div key={k} className="border-b border-line pb-2"><dt className="text-xs font-bold uppercase tracking-wider text-faint">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
          </section>
          <section className="mt-8 rounded-card bg-ground p-5 text-sm text-muted">
            <div className="mb-1 font-bold text-navy">Zo werkt het via Timmerly</div>
            Opdrachtbevestiging vóór de start met tarief, looptijd en opzegtermijn · wekelijkse urenregistratie, goedkeuring door de opdrachtgever · beide partijen beoordelen elkaar na afronding. Bij een zzp-opdracht hoort de ZZP-check.
          </section>
        </div>

        <aside className="card h-fit lg:sticky lg:top-20">
          <div className="text-2xl font-bold">{project.rateMin ? `€${project.rateMin} – €${project.rateMax}` : 'In overleg'}<span className="text-sm font-semibold text-muted"> per uur</span></div>
          <div className="mb-5 mt-1 text-sm text-muted">{spots} van {project.headcount} {spots === 1 ? 'plek' : 'plekken'} open</div>
          {session?.role === 'company' ? (
            <p className="text-sm text-muted">Je bent ingelogd als opdrachtgever. <Link href="/projecten/nieuw">Plaats zelf een project</Link>.</p>
          ) : project.status === 'filled' ? (
            <p className="text-sm text-muted">Dit project is ingevuld. <Link href="/projecten">Bekijk andere projecten</Link>.</p>
          ) : (
            <InterestButton projectId={project.id} applied={!!application} saved={saved} canSave={!!session} />
          )}
          {!session && <p className="mt-4 text-sm"><Link href={`/inloggen?next=/projecten/${project.id}`}>Al een account? Log in</Link> om je matchscore te zien.</p>}
        </aside>
      </div>
    </div>
  );
}
