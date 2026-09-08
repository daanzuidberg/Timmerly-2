import { and, desc, eq, isNull, schema } from '@timmerly/db';
import { REVIEW_CATEGORY_LABELS } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { CompanyProfileForm } from '@/components/forms/CompanyProfileForm';
import { Alert, Card, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ nieuw?: string; next?: string }> }) {
  const user = await requireRole('company');
  const { nieuw, next } = await searchParams;
  const company = await getCompanyProfile(user.id);
  const v = await db().query.verifications.findFirst({ where: and(eq(schema.verifications.userId, user.id), eq(schema.verifications.kind, 'company')) });
  const reviews = await db().query.reviews.findMany({ where: and(eq(schema.reviews.subjectId, user.id), isNull(schema.reviews.hiddenAt)), orderBy: desc(schema.reviews.createdAt) });
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.overall, 0) / reviews.length / 10).toFixed(1).replace('.', ',') : null;
  return (
    <AppShell user={user} title={company ? 'Bedrijfsprofiel' : 'Welkom bij Timmerly'} subtitle={company ? company.name : 'Vul je bedrijfsgegevens in om projecten te kunnen plaatsen'}>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {nieuw && !company && <Alert tone="info">Je bedrijfsgegevens worden geverifieerd op KvK. Daarna publiceren je projecten direct; tot die tijd beoordeelt het Timmerly-team ze eerst.</Alert>}
          <Card title="Gegevens"><CompanyProfileForm company={company} next={next ?? (company ? undefined : '/dashboard')} /></Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card title="Verificatie"><div className="flex items-center justify-between text-sm"><span>Bedrijf (KvK)</span><StatusPill status={company ? (v?.status ?? 'pending') : 'unverified'} /></div>{v?.note && <p className="mt-2 text-sm text-muted">{v.note}</p>}</Card>
          <Card title="Reputatie">{reviews.length ? <><div className="text-2xl font-bold">{avg} <span className="text-sm font-normal text-muted">/ 5 · {reviews.length} reviews van vakmensen</span></div><ul className="mt-3 flex flex-col gap-3">{reviews.slice(0, 5).map((r) => <li key={r.id} className="text-sm"><p>{r.comment}</p><div className="mt-1 flex flex-wrap gap-1">{Object.entries(r.scores).map(([k, s]) => <span key={k} className="rounded-md bg-ground px-2 py-0.5 text-xs">{REVIEW_CATEGORY_LABELS[k] ?? k} {s}</span>)}</div></li>)}</ul></> : <p className="text-sm text-muted">Nog geen reviews. Vakmensen beoordelen je na een afgeronde opdracht op communicatie, betaling, organisatie, sfeer, duidelijkheid, materiaal en planning.</p>}</Card>
        </div>
      </div>
    </AppShell>
  );
}
