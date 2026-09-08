import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, desc, eq, inArray, isNull, schema, count, lte, gte } from '@timmerly/db';
import { addDays, formatDateNl, todayIso, CERTIFICATE_LABELS, type CertificateType } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getCompanyProfile, getProfessionalProfile } from '@/lib/auth/profiles';
import { searchProjects } from '@/lib/search/projects';
import { AppShell } from '@/components/AppShell';
import { ProjectCard } from '@/components/ProjectCard';
import { AvailabilityToggle } from '@/components/AvailabilityControls';
import { Alert, Card, Empty, Progress, Stat, StatusPill } from '@/components/ui';
import { projectSearchSchema } from '@timmerly/core';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welkom?: string }> }) {
  const user = await requireUser();
  if (user.role === 'admin' || user.role === 'moderator') redirect('/admin');
  const { welkom } = await searchParams;
  const greeting = new Date().getHours() < 12 ? 'Goedemorgen' : new Date().getHours() < 18 ? 'Goedemiddag' : 'Goedenavond';
  const d = db();

  if (user.role === 'professional') {
    const profile = await getProfessionalProfile(user.id);
    if (!profile?.onboardingCompletedAt) redirect('/onboarding');
    const [matches, apps, certs, verifs] = await Promise.all([
      searchProjects(projectSearchSchema.parse({ sort: 'match' }), profile),
      d.query.applications.findMany({ where: eq(schema.applications.profileId, profile.id), orderBy: desc(schema.applications.updatedAt), limit: 5, with: { project: { columns: { id: true, title: true, city: true } } } }),
      d.query.certificates.findMany({ where: eq(schema.certificates.profileId, profile.id) }),
      d.query.verifications.findMany({ where: eq(schema.verifications.userId, user.id) })
    ]);
    const top = matches.filter((m) => (m.score ?? 0) >= 60).slice(0, 3);
    const active = apps.filter((a) => a.stage === 'active');
    const expiring = certs.filter((c) => c.expiresAt && c.expiresAt <= addDays(todayIso(), 30) && c.status !== 'expired');
    const identity = verifs.find((v) => v.kind === 'identity');
    const tips = [
      !user.emailVerified && ['Bevestig je e-mailadres', 'Nodig om interesse te tonen.', '/registreren/bevestig'],
      certs.length === 0 && ['Voeg je certificaten toe', 'VCA is bij de meeste projecten vereist.', '/profiel/certificaten'],
      profile.bio.length < 40 && ['Schrijf iets over jezelf', 'Profielen met een omschrijving worden vaker benaderd.', '/profiel'],
      profile.workArrangement !== 'employment' && !profile.zzp && ['Vul je ZZP-gegevens in', 'Nodig voor de ZZP-verificatie.', '/profiel/zzp']
    ].filter(Boolean) as string[][];

    return (
      <AppShell user={user} title={`${greeting}, ${user.firstName}`} subtitle={top.length ? `${top.length} ${top.length === 1 ? 'project past' : 'projecten passen'} goed bij je profiel` : 'Nog geen sterke matches — we laten het weten zodra er iets past'}>
        {welkom && <div className="mb-6"><Alert tone="ok"><strong>Je profiel is actief.</strong> Het Timmerly-team beoordeelt je gegevens binnen twee werkdagen. Intussen kun je projecten bekijken{user.emailVerified ? ' en interesse tonen' : ''}.</Alert></div>}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <Card title="Beschikbaarheid" action={<Link href="/profiel/beschikbaarheid" className="text-sm font-bold">Kalender</Link>}>
              <AvailabilityToggle current={profile.availability} />
              <p className="mt-2 text-sm text-muted">{profile.availableFrom ? `Beschikbaar vanaf ${formatDateNl(profile.availableFrom)}` : 'Per direct beschikbaar'} · {profile.hoursPerWeek} u/week · tot {profile.maxTravelKm} km van {profile.city}</p>
            </Card>
            <Card title="Projecten die bij je passen" action={<Link href="/projecten" className="text-sm font-bold">Alle projecten</Link>}>
              {top.length ? <div className="grid gap-4 md:grid-cols-3">{top.map((m) => <ProjectCard key={m.project.id} project={m.project} score={m.score ?? undefined} distanceKm={m.distanceKm} />)}</div> : <Empty>Nog geen projecten met een sterke match. Vergroot je reisafstand of voeg specialisaties toe.</Empty>}
            </Card>
            <Card title="Mijn aanmeldingen" action={<Link href="/aanmeldingen" className="text-sm font-bold">Alles</Link>}>
              {apps.length ? <ul className="divide-y divide-line">{apps.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 py-2.5"><Link href={`/berichten/${a.id}`} className="font-semibold text-navy no-underline hover:text-orange-700">{a.project.title}<span className="block text-sm font-normal text-muted">{a.project.city}{a.matchScore ? ` · ${a.matchScore}% match` : ''}</span></Link><StatusPill status={a.stage} /></li>)}</ul> : <Empty>Nog geen aanmeldingen.</Empty>}
            </Card>
          </div>
          <div className="flex flex-col gap-5">
            <Card title="Profiel">
              <div className="mb-1 flex items-baseline justify-between"><span className="text-2xl font-bold">{profile.profileCompleteness}%</span><span className="text-sm text-muted">compleet</span></div>
              <Progress value={profile.profileCompleteness} />
              <ul className="mt-4 flex flex-col gap-2">{tips.slice(0, 3).map(([t, b, h]) => <li key={t}><Link href={h!} className="block rounded-card border border-line p-3 no-underline hover:border-navy"><div className="text-sm font-bold text-navy">{t}</div><div className="text-xs text-muted">{b}</div></Link></li>)}</ul>
              <div className="mt-3 text-sm">Identiteit: <StatusPill status={identity?.status ?? 'unverified'} /></div>
            </Card>
            {active.length > 0 && <Card title="Lopende opdracht">{active.map((a) => <div key={a.id}><div className="font-bold">{a.project.title}</div><div className="mb-3 text-sm text-muted">{a.project.city}</div><div className="flex gap-2"><Link href={`/uren/${a.id}`} className="btn-primary btn-sm">Uren invoeren</Link><Link href={`/berichten/${a.id}`} className="btn-secondary btn-sm">Gesprek</Link></div></div>)}</Card>}
            <Card title="Certificaten" action={<Link href="/profiel/certificaten" className="text-sm font-bold">Beheren</Link>}>
              {certs.length ? <ul className="flex flex-col gap-2 text-sm">{certs.map((c) => <li key={c.id} className="flex items-center justify-between"><span>{CERTIFICATE_LABELS[c.type as CertificateType]}</span>{expiring.includes(c) ? <span className="pill bg-warn-100 text-warn-800">Verloopt {formatDateNl(c.expiresAt)}</span> : <StatusPill status={c.status} />}</li>)}</ul> : <p className="text-sm text-muted">Nog geen certificaten.</p>}
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Opdrachtgever ─────────────────────────────────────────────────────────
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf?nieuw=1');
  const projects = await d.query.projects.findMany({ where: and(eq(schema.projects.companyId, company.id), eq(schema.projects.isTemplate, false)), orderBy: desc(schema.projects.createdAt), limit: 8 });
  const ids = projects.map((p) => p.id);
  const appsByProject = ids.length ? await d.select({ projectId: schema.applications.projectId, stage: schema.applications.stage, n: count() }).from(schema.applications).where(inArray(schema.applications.projectId, ids)).groupBy(schema.applications.projectId, schema.applications.stage) : [];
  const openTs = ids.length ? await d.select({ n: count() }).from(schema.timesheets).innerJoin(schema.applications, eq(schema.applications.id, schema.timesheets.applicationId)).where(and(inArray(schema.applications.projectId, ids), eq(schema.timesheets.status, 'submitted'))) : [{ n: 0 }];
  const openProjects = projects.filter((p) => ['published', 'matching'].includes(p.status));
  const newInterest = appsByProject.filter((a) => a.stage === 'interest').reduce((s, a) => s + a.n, 0);
  const activeN = appsByProject.filter((a) => a.stage === 'active').reduce((s, a) => s + a.n, 0);
  const startingSoon = projects.filter((p) => p.status === 'published' && p.startDate <= addDays(todayIso(), 14) && p.startDate >= todayIso() && p.filledCount < p.headcount);
  void lte; void gte; void isNull;

  return (
    <AppShell user={user} title={`${greeting}!`} subtitle={company.name} actions={<Link href="/projecten/nieuw" className="btn-primary btn-sm">Project plaatsen</Link>}>
      {!company.verifiedAt && <div className="mb-6"><Alert tone="warn"><strong>Bedrijfsverificatie loopt.</strong> Tot je KvK-gegevens zijn gecontroleerd gaan nieuwe projecten eerst langs het Timmerly-team.</Alert></div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Openstaande projecten" value={openProjects.length} hint={startingSoon.length ? `${startingSoon.length} start binnen 2 weken met tekort` : 'geen tekorten'} />
        <Stat label="Nieuwe kandidaten" value={newInterest} hint="wachten op reactie" />
        <Stat label="Lopende opdrachten" value={activeN} />
        <Stat label="Uren te keuren" value={openTs[0]!.n} hint={openTs[0]!.n ? 'ingediend door vakmensen' : 'alles bijgewerkt'} />
      </div>
      <Card title="Mijn projecten" action={<Link href="/mijn-projecten" className="text-sm font-bold">Alles</Link>}>
        {projects.length ? (
          <ul className="divide-y divide-line">{projects.map((p) => { const n = appsByProject.filter((a) => a.projectId === p.id).reduce((s, a) => s + a.n, 0); return (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3"><Link href={`/mijn-projecten/${p.id}`} className="min-w-0 font-semibold text-navy no-underline hover:text-orange-700"><span className="block truncate">{p.title}</span><span className="block text-sm font-normal text-muted">{p.city} · start {formatDateNl(p.startDate)} · {p.filledCount}/{p.headcount} ingevuld · {n} {n === 1 ? 'kandidaat' : 'kandidaten'}</span></Link><StatusPill status={p.status} /></li>
          ); })}</ul>
        ) : <Empty>Nog geen projecten. <Link href="/projecten/nieuw">Plaats je eerste project</Link> — het kost drie minuten.</Empty>}
      </Card>
    </AppShell>
  );
}
