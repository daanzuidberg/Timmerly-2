import { redirect } from 'next/navigation';
import { eq, schema } from '@timmerly/db';
import { CERTIFICATE_LABELS, addDays, formatDateNl, todayIso, type CertificateType } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { removeCertificate } from '@/lib/actions/profile';
import { AppShell } from '@/components/AppShell';
import { CertificateForm } from '@/components/forms/CertificateForm';
import { Card, Empty, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const certs = await db().query.certificates.findMany({ where: eq(schema.certificates.profileId, profile.id) });
  const soon = addDays(todayIso(), 30);
  return (
    <AppShell user={user} title="Certificaten" subtitle="Geverifieerde certificaten tellen volledig mee in je matchscore">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Mijn certificaten">
          {certs.length ? <ul className="divide-y divide-line">{certs.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 py-3"><div><div className="font-bold">{c.type === 'other' && c.label ? c.label : CERTIFICATE_LABELS[c.type as CertificateType]}</div><div className="text-sm text-muted">{c.expiresAt ? `Geldig tot ${formatDateNl(c.expiresAt)}` : 'Geen einddatum'}{c.documentNumber ? ` · nr. ${c.documentNumber}` : ''}{c.reviewNote ? ` · ${c.reviewNote}` : ''}</div></div><div className="flex items-center gap-2">{c.expiresAt && c.expiresAt <= soon && c.status === 'verified' ? <Pill tone="warn">Verloopt binnenkort</Pill> : <StatusPill status={c.status} />}<form action={removeCertificate.bind(null, c.id)}><button className="btn-ghost btn-sm" type="submit" aria-label="Verwijderen">✕</button></form></div></li>)}</ul> : <Empty>Nog geen certificaten toegevoegd.</Empty>}
        </Card>
        <Card title="Certificaat toevoegen"><CertificateForm /></Card>
      </div>
    </AppShell>
  );
}
