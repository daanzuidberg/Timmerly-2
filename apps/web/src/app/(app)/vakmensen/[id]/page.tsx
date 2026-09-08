import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq, inArray, isNull, schema } from '@timmerly/db';
import { CERTIFICATE_LABELS, REVIEW_CATEGORY_LABELS, SPECIALISM_LABELS, TRADE_LABELS, formatDateNl, type CertificateType, type Specialism, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { toggleFavorite } from '@/lib/actions/profile';
import { AppShell } from '@/components/AppShell';
import { InviteButton } from '@/components/CandidateActions';
import { Avatar, Card, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Profiel zoals een opdrachtgever het ziet. Naam en contact pas na een aanmelding of benadering. */
export default async function ProfessionalDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const d = db();
  const p = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.id, id), with: { user: { columns: { id: true, firstName: true, lastName: true, status: true } }, certificates: true, workHistory: { orderBy: desc(schema.workHistory.startDate) } } });
  if (!p || p.user.status !== 'active' || !p.onboardingCompletedAt) notFound();
  const company = user.role === 'company' ? await getCompanyProfile(user.id) : null;
  const isStaff = user.role === 'admin' || user.role === 'moderator';
  const contact = company ? await d.query.applications.findFirst({ where: and(eq(schema.applications.profileId, id), inArray(schema.applications.stage, ['interest', 'contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed'])), with: { project: { columns: { companyId: true } } } }) : null;
  const revealed = isStaff || (contact && contact.project.companyId === company?.id) || p.userId === user.id;
  const reviews = await d.query.reviews.findMany({ where: and(eq(schema.reviews.subjectId, p.userId), isNull(schema.reviews.hiddenAt)), orderBy: desc(schema.reviews.createdAt), with: { application: { with: { project: { with: { company: { columns: { name: true } } } } } } } });
  const verifs = await d.query.verifications.findMany({ where: and(eq(schema.verifications.userId, p.userId), eq(schema.verifications.status, 'verified')) });
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.overall, 0) / reviews.length / 10).toFixed(1).replace('.', ',') : null;
  const openProjects = company ? await d.query.projects.findMany({ where: and(eq(schema.projects.companyId, company.id), inArray(schema.projects.status, ['published', 'matching'])) }) : [];
  const fav = company ? await d.query.favorites.findFirst({ where: and(eq(schema.favorites.ownerId, user.id), eq(schema.favorites.targetId, p.userId)) }) : null;
  const name = revealed ? `${p.user.firstName} ${p.user.lastName}` : `${TRADE_LABELS[p.trade as Trade]} uit ${p.city}`;
  const badges = [['Identiteit geverifieerd', verifs.some((v) => v.kind === 'identity')], ['ZZP geverifieerd', verifs.some((v) => v.kind === 'zzp')], ['VCA geverifieerd', p.certificates.some((c) => c.status === 'verified' && c.type.startsWith('vca'))], ['Top vakman', p.trustScore >= 80], ['Snel beschikbaar', p.availability === 'available' && !p.availableFrom], [avg ? `${avg} beoordeling` : '', !!avg]];

  return (
    <AppShell user={user} title={name} subtitle={`${TRADE_LABELS[p.trade as Trade]} · ${p.city} · ${p.yearsExperience} jaar ervaring`}>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center gap-4"><Avatar name={revealed ? name : TRADE_LABELS[p.trade as Trade]} size={56} /><div><div className="flex flex-wrap gap-1.5">{badges.filter((b) => b[1]).map(([l]) => <Pill key={String(l)} tone="ok">✓ {l}</Pill>)}</div><div className="mt-2 flex flex-wrap gap-1">{p.specialisms.map((s) => <span key={s} className="rounded-md bg-ground px-2 py-0.5 text-xs font-bold">{SPECIALISM_LABELS[s as Specialism] ?? s}</span>)}</div></div></div>
            {p.bio && <p className="mt-4 text-[15px]">{p.bio}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[['Beschikbaar', p.availableFrom ? `vanaf ${formatDateNl(p.availableFrom)}` : 'per direct'], ['Reisafstand', `${p.maxTravelKm} km`], ['Contract', p.workArrangement === 'zzp' ? 'ZZP' : p.workArrangement === 'employment' ? 'Loondienst' : 'ZZP of loondienst'], ['Tarief', p.visibility.showRate && p.hourlyRateMin ? `vanaf €${p.hourlyRateMin}/u` : 'in overleg']].map(([k, v]) => <div key={k} className="rounded-card bg-ground p-3"><div className="eyebrow">{k}</div><div className="font-bold">{v}</div></div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">{p.hasDriversLicense && <span>✓ Rijbewijs</span>}{p.hasOwnTransport && <span>✓ Eigen vervoer</span>}{p.hasOwnTools && <span>✓ Eigen gereedschap</span>}</div>
          </Card>
          <Card title="Certificaten">{p.certificates.length ? <ul className="flex flex-col gap-2 text-sm">{p.certificates.map((c) => <li key={c.id} className="flex items-center justify-between"><span>{CERTIFICATE_LABELS[c.type as CertificateType]}{c.expiresAt ? ` · geldig tot ${formatDateNl(c.expiresAt)}` : ''}</span><StatusPill status={c.status} /></li>)}</ul> : <p className="text-sm text-muted">Geen certificaten opgegeven.</p>}</Card>
          <Card title="Werkhistorie">{p.workHistory.length ? <ul className="divide-y divide-line">{p.workHistory.map((h) => <li key={h.id} className="py-3"><div className="font-bold">{h.title}{h.projectId && <Pill tone="ok"> via Timmerly</Pill>}</div><div className="text-sm text-muted">{[h.role, revealed ? h.client : null, h.city].filter(Boolean).join(' · ')}{h.startDate ? ` · ${formatDateNl(h.startDate)} – ${h.endDate ? formatDateNl(h.endDate) : 'heden'}` : ''}</div>{h.description && <div className="mt-1 text-sm">{h.description}</div>}</li>)}</ul> : <p className="text-sm text-muted">Nog geen werkhistorie.</p>}</Card>
          <Card title={`Reviews${avg ? ` · ${avg}` : ''}`}>{reviews.length ? <ul className="flex flex-col gap-4">{reviews.map((r) => <li key={r.id} className="border-b border-line pb-3 last:border-0"><div className="flex justify-between"><span className="font-bold">{r.application.project.company.name}</span><span className="font-bold text-orange-700">{(r.overall / 10).toFixed(1).replace('.', ',')}</span></div><p className="mt-1 text-sm">{r.comment}</p><div className="mt-2 flex flex-wrap gap-1">{Object.entries(r.scores).map(([k, s]) => <span key={k} className="rounded-md bg-ground px-2 py-0.5 text-xs">{REVIEW_CATEGORY_LABELS[k] ?? k} {s}</span>)}</div></li>)}</ul> : <p className="text-sm text-muted">Nog geen reviews via Timmerly.</p>}</Card>
        </div>
        {company && (
          <div className="flex flex-col gap-5">
            <Card title="Benaderen voor een project">
              {openProjects.length ? <ul className="flex flex-col gap-2">{openProjects.map((pr) => <li key={pr.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-semibold">{pr.title}</span><InviteButton projectId={pr.id} profileId={p.id} invited={!!contact && contact.projectId === pr.id} /></li>)}</ul> : <p className="text-sm text-muted">Je hebt geen open projecten. <Link href="/projecten/nieuw">Plaats een project</Link>.</p>}
            </Card>
            <Card title="Talentpool"><form action={toggleFavorite.bind(null, p.userId, 'Favoriet')}><button type="submit" className={fav ? 'btn btn-sm bg-ok-100 text-ok-800' : 'btn-secondary btn-sm'}>{fav ? 'In talentpool ✓' : 'Toevoegen aan talentpool'}</button></form></Card>
            <Card title="Melden"><Link href={`/melden?user=${p.userId}`} className="text-sm">Nepaccount, fraude of ongewenst gedrag melden</Link></Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
