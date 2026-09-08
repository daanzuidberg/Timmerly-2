import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, desc, eq, isNull, schema } from '@timmerly/db';
import { REVIEW_CATEGORY_LABELS, SPECIALISM_LABELS, TRADE_LABELS, formatDateNl, type Specialism, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { removeWorkHistory } from '@/lib/actions/profile';
import { AppShell } from '@/components/AppShell';
import { ProfessionalProfileForm } from '@/components/forms/ProfessionalProfileForm';
import { WorkHistoryForm } from '@/components/forms/WorkHistoryForm';
import { Card, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const d = db();
  const [verifs, history, reviews, userRow] = await Promise.all([
    d.query.verifications.findMany({ where: eq(schema.verifications.userId, user.id) }),
    d.query.workHistory.findMany({ where: eq(schema.workHistory.profileId, profile.id), orderBy: desc(schema.workHistory.startDate) }),
    d.query.reviews.findMany({ where: and(eq(schema.reviews.subjectId, user.id), isNull(schema.reviews.hiddenAt)), orderBy: desc(schema.reviews.createdAt), with: { author: { columns: { firstName: true } }, application: { with: { project: { with: { company: { columns: { name: true } } } } } } } }),
    d.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { phone: true } })
  ]);
  const v = (k: string) => verifs.find((x) => x.kind === k)?.status ?? 'unverified';
  const badges = [['Identiteit geverifieerd', v('identity') === 'verified'], ['ZZP geverifieerd', v('zzp') === 'verified'], ['E-mail geverifieerd', v('email') === 'verified'], ['Snel beschikbaar', profile.availability === 'available' && !profile.availableFrom]];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.overall, 0) / reviews.length / 10).toFixed(1).replace('.', ',') : null;
  const trust = profile.trustScore >= 75 ? 'Hoog' : profile.trustScore >= 50 ? 'Gemiddeld' : 'Opbouwend';

  return (
    <AppShell user={user} title="Mijn profiel" subtitle="Zo zien aannemers je profiel" actions={<Link href="/profiel/certificaten" className="btn-secondary btn-sm">Certificaten</Link>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2><div className="text-muted">{TRADE_LABELS[profile.trade as Trade]} · {profile.city} · {profile.yearsExperience} jaar ervaring</div></div>
              <div className="flex gap-2">{badges.filter((b) => b[1]).map(([l]) => <Pill key={String(l)} tone="ok">✓ {l}</Pill>)}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{profile.specialisms.map((s) => <span key={s} className="rounded-[3px] border border-line bg-ground px-2.5 py-1 text-xs font-bold">{SPECIALISM_LABELS[s as Specialism] ?? s}</span>)}</div>
            {profile.bio && <p className="mt-4 text-[15px]">{profile.bio}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Trust', trust, 'verificaties, opkomst, reviews'], ['Beoordeling', avg ?? '—', `${reviews.length} reviews`], ['Afgerond', String(reviews.length), 'projecten via Timmerly'], ['Reisafstand', `${profile.maxTravelKm} km`, `vanaf ${profile.city}`]].map(([l, val, h]) => <div key={l} className="rounded-card bg-ground p-3"><div className="eyebrow">{l}</div><div className="text-lg font-bold">{val}</div><div className="text-xs text-muted">{h}</div></div>)}
            </div>
          </Card>
          <Card title="Gegevens bewerken"><ProfessionalProfileForm profile={profile} phone={userRow?.phone} section="all" /></Card>
          <Card title="Werkhistorie">
            {history.length ? <ul className="mb-5 divide-y divide-line">{history.map((h) => <li key={h.id} className="flex items-start justify-between gap-3 py-3"><div><div className="font-bold">{h.title}{h.projectId && <Pill tone="ok"> via Timmerly</Pill>}</div><div className="text-sm text-muted">{[h.role, h.client, h.city].filter(Boolean).join(' · ')}{h.startDate ? ` · ${formatDateNl(h.startDate)}${h.endDate ? ` – ${formatDateNl(h.endDate)}` : ' – heden'}` : ''}</div>{h.description && <div className="mt-1 text-sm">{h.description}</div>}</div><form action={removeWorkHistory.bind(null, h.id)}><button className="btn-ghost btn-sm" type="submit">Verwijderen</button></form></li>)}</ul> : <p className="mb-5 text-sm text-muted">Voeg eerdere projecten toe: aannemers kijken hier als eerste naar.</p>}
            <WorkHistoryForm />
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card title="Verificaties">
            <ul className="flex flex-col gap-2 text-sm">{[['E-mail', 'email'], ['Telefoon', 'phone'], ['Identiteit', 'identity'], ['ZZP-status', 'zzp']].map(([l, k]) => <li key={k} className="flex items-center justify-between"><span>{l}</span><StatusPill status={k === 'phone' ? (userRow?.phone ? v('phone') : 'unverified') : v(k!)} /></li>)}</ul>
            {profile.workArrangement !== 'employment' && <Link href="/profiel/zzp" className="btn-secondary btn-sm mt-4">ZZP-gegevens</Link>}
          </Card>
          <Card title="Reviews van opdrachtgevers">
            {reviews.length ? <ul className="flex flex-col gap-4">{reviews.map((r) => <li key={r.id} className="border-b border-line pb-3 last:border-0"><div className="flex items-center justify-between"><span className="font-bold">{r.application.project.company.name}</span><span className="font-bold text-orange-700">{(r.overall / 10).toFixed(1).replace('.', ',')}</span></div><p className="mt-1 text-sm">{r.comment}</p><div className="mt-2 flex flex-wrap gap-1">{Object.entries(r.scores).map(([k, s]) => <span key={k} className="rounded-[3px] bg-ground px-2 py-0.5 text-xs">{REVIEW_CATEGORY_LABELS[k] ?? k} {s}</span>)}</div></li>)}</ul> : <p className="text-sm text-muted">Nog geen reviews. Die komen na je eerste afgeronde opdracht via Timmerly.</p>}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
