import { asc, eq, schema } from '@timmerly/db';
import { CERTIFICATE_LABELS, formatDateNl, type CertificateType } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { CertificateDecision, VerificationDecision } from '@/components/AdminActions';
import { Card, Empty } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function VerificationQueue() {
  const user = await requireRole('admin', 'moderator');
  const d = db();
  const verifs = await d.query.verifications.findMany({ where: eq(schema.verifications.status, 'pending'), orderBy: asc(schema.verifications.createdAt), with: { user: { columns: { firstName: true, lastName: true, email: true, role: true } } } });
  const certs = await d.query.certificates.findMany({ where: eq(schema.certificates.status, 'pending'), orderBy: asc(schema.certificates.createdAt), with: { profile: { with: { user: { columns: { firstName: true, lastName: true, email: true } } } } } });
  const kindLabel: Record<string, string> = { identity: 'Identiteit', company: 'Bedrijf (KvK)', zzp: 'ZZP-status', phone: 'Telefoon', email: 'E-mail', certificate: 'Certificaat' };
  return (
    <AppShell user={user} title="Verificaties" subtitle="Oudste eerst · elke beslissing wordt vastgelegd in de auditlog">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`Identiteit, bedrijf en ZZP (${verifs.length})`}>
          {verifs.length ? <ul className="flex flex-col gap-4">{verifs.filter((v) => v.kind !== 'email').map((v) => <li key={v.id} className="rounded-card border border-line p-4"><div className="flex justify-between"><div><div className="font-bold">{kindLabel[v.kind]} · {v.user.firstName} {v.user.lastName}</div><div className="text-sm text-muted">{v.user.email} · {v.user.role} · ingediend {formatDateNl(v.createdAt.toISOString())}</div></div></div>{Object.keys(v.evidence).length > 0 && <dl className="mt-2 grid grid-cols-[140px_1fr] gap-y-1 text-sm">{Object.entries(v.evidence).map(([k, val]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="font-semibold">{String(val ?? '—')}</dd></div>)}</dl>}<div className="mt-3"><VerificationDecision id={v.id} /></div></li>)}</ul> : <Empty>Niets te doen.</Empty>}
        </Card>
        <Card title={`Certificaten (${certs.length})`}>
          {certs.length ? <ul className="flex flex-col gap-4">{certs.map((c) => <li key={c.id} className="rounded-card border border-line p-4"><div className="font-bold">{CERTIFICATE_LABELS[c.type as CertificateType]}{c.label ? ` · ${c.label}` : ''}</div><div className="text-sm text-muted">{c.profile.user.firstName} {c.profile.user.lastName} · {c.profile.user.email}{c.documentNumber ? ` · nr. ${c.documentNumber}` : ''}{c.expiresAt ? ` · geldig tot ${formatDateNl(c.expiresAt)}` : ''}</div><div className="mt-3"><CertificateDecision id={c.id} /></div></li>)}</ul> : <Empty>Niets te doen.</Empty>}
        </Card>
      </div>
    </AppShell>
  );
}
