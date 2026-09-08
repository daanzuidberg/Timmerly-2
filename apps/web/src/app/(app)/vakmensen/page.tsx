import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq, schema, sql, inArray } from '@timmerly/db';
import { ACTIVE_TRADES, AVAILABILITY_LABELS, CERTIFICATE_LABELS, CERTIFICATE_TYPES, SPECIALISMS, SPECIALISM_LABELS, TRADE_LABELS, distanceKm, formatDateNl, type CertificateType, type Trade, type Specialism, type AvailabilityStatus } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { Empty, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Zoeken in de talentpool van Timmerly. Namen zijn verborgen tot er contact is
 * (privacy van de vakman); wat je ziet is genoeg om te kiezen.
 */
export default async function ProfessionalsSearch({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf?nieuw=1');
  const q = await searchParams;
  const d = db();
  const conds = [eq(schema.users.status, 'active'), sql`${schema.professionalProfiles.onboardingCompletedAt} is not null`, sql`(${schema.professionalProfiles.visibility}->>'searchable')::boolean`];
  if (q.trade) conds.push(eq(schema.professionalProfiles.trade, q.trade));
  if (q.specialism) conds.push(sql`${q.specialism} = any(${schema.professionalProfiles.specialisms})`);
  if (q.minYears) conds.push(sql`${schema.professionalProfiles.yearsExperience} >= ${Number(q.minYears)}`);
  if (q.availableFrom) conds.push(sql`coalesce(${schema.professionalProfiles.availableFrom}, current_date) <= ${q.availableFrom}::date`);
  if (q.arrangement && q.arrangement !== 'either') conds.push(inArray(schema.professionalProfiles.workArrangement, [q.arrangement as 'zzp' | 'employment', 'either']));
  const rows = await d.select({ p: schema.professionalProfiles }).from(schema.professionalProfiles).innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId)).where(and(...conds)).limit(100);
  const ids = rows.map((r) => r.p.id);
  const certs = ids.length ? await d.select().from(schema.certificates).where(and(inArray(schema.certificates.profileId, ids), eq(schema.certificates.status, 'verified'))) : [];
  const origin = company.lat != null && company.lng != null ? { lat: company.lat, lng: company.lng } : null;
  let items = rows.map((r) => ({ p: r.p, km: origin && r.p.lat != null && r.p.lng != null ? Math.round(distanceKm(origin, { lat: r.p.lat, lng: r.p.lng })) : null, certs: certs.filter((c) => c.profileId === r.p.id) }));
  if (q.certificate) items = items.filter((i) => i.certs.some((c) => c.type === q.certificate || (q.certificate === 'vca_basis' && c.type === 'vca_vol')));
  if (q.maxKm) items = items.filter((i) => i.km !== null && i.km <= Number(q.maxKm));
  items.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));

  const sel = (name: string, label: string, opts: ReadonlyArray<[string, string]>) => <div><label className="label" htmlFor={name}>{label}</label><select id={name} name={name} className="input" defaultValue={q[name] ?? ''}><option value="">Alle</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;

  return (
    <AppShell user={user} title="Vakmensen zoeken" subtitle={`${items.length} beschikbare profielen${origin ? ` rond ${company.city}` : ''}`}>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <form method="get" className="card flex flex-col gap-4">
          {sel('trade', 'Functie', ACTIVE_TRADES.map((t) => [t, TRADE_LABELS[t]]))}
          {sel('specialism', 'Specialisatie', SPECIALISMS.map((s) => [s, SPECIALISM_LABELS[s]]))}
          {sel('certificate', 'Certificaat (geverifieerd)', CERTIFICATE_TYPES.filter((c) => c !== 'other').map((c) => [c, CERTIFICATE_LABELS[c]]))}
          {sel('minYears', 'Minimale ervaring', [['2', '2 jaar'], ['3', '3 jaar'], ['5', '5 jaar'], ['10', '10 jaar']])}
          {sel('arrangement', 'Contractvorm', [['zzp', 'ZZP'], ['employment', 'Loondienst']])}
          {sel('maxKm', 'Afstand', [['25', 'Tot 25 km'], ['50', 'Tot 50 km'], ['100', 'Tot 100 km']])}
          <div><label className="label" htmlFor="availableFrom">Beschikbaar vanaf</label><input id="availableFrom" name="availableFrom" type="date" className="input" defaultValue={q.availableFrom ?? ''} /></div>
          <button className="btn-dark" type="submit">Zoeken</button><Link href="/vakmensen" className="text-center text-sm font-bold">Wissen</Link>
        </form>
        <div>
          {items.length ? <div className="grid gap-4 md:grid-cols-2">{items.map((i) => (
            <Link key={i.p.id} href={`/vakmensen/${i.p.id}`} className="card no-underline transition hover:border-navy">
              <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-navy">{TRADE_LABELS[i.p.trade as Trade]}</div><div className="text-sm text-muted">{i.p.city}{i.km != null ? ` · ${i.km} km` : ''} · {i.p.yearsExperience} jaar</div></div><StatusPill status={i.p.availability} /></div>
              <div className="mt-2 flex flex-wrap gap-1">{i.p.specialisms.slice(0, 4).map((s) => <span key={s} className="rounded-md bg-ground px-2 py-0.5 text-xs font-bold text-navy">{SPECIALISM_LABELS[s as Specialism] ?? s}</span>)}</div>
              <div className="mt-2 flex flex-wrap gap-1">{i.certs.map((c) => <Pill key={c.id} tone="ok">✓ {CERTIFICATE_LABELS[c.type as CertificateType]}</Pill>)}{i.p.trustScore >= 75 && <Pill tone="orange">Top vakman</Pill>}</div>
              <div className="mt-2 text-sm text-muted">{i.p.availableFrom ? `Beschikbaar vanaf ${formatDateNl(i.p.availableFrom)}` : AVAILABILITY_LABELS[i.p.availability as AvailabilityStatus]} · {i.p.workArrangement === 'zzp' ? 'ZZP' : i.p.workArrangement === 'employment' ? 'Loondienst' : 'ZZP of loondienst'}</div>
            </Link>
          ))}</div> : <Empty>Geen vakmensen gevonden met deze filters.</Empty>}
        </div>
      </div>
    </AppShell>
  );
}
