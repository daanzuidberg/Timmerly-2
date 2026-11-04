import Link from 'next/link';
import { and, desc, eq, ilike, inArray, or, schema, count } from '@timmerly/db';
import { TRADE_LABELS, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { UserStatusButton } from '@/components/AdminActions';
import { Card, Empty, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * StatusPill deelt één label-map over alle statusdomeinen in de app heen, en
 * "active" betekent daar "opdracht loopt" (applicatiestatus) — voor een
 * accountstatus zou dat dus "Opdracht loopt" tonen in plaats van "Actief".
 * Vandaar een eigen, kleine weergave voor accountstatus.
 */
function AccountStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: 'ok' | 'bad' | 'neutral'; label: string }> = {
    active: { tone: 'ok', label: 'Actief' },
    suspended: { tone: 'bad', label: 'Geblokkeerd' },
    deleted: { tone: 'neutral', label: 'Verwijderd' }
  };
  const m = map[status] ?? { tone: 'neutral' as const, label: status };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

/**
 * CRM-overzicht voor het team: vakmensen (zzp'ers) en klanten (bedrijven) strikt
 * gescheiden — het zijn twee heel verschillende doelgroepen met andere
 * kengetallen, op één hoop gooien maakt het onoverzichtelijk. Eén bedrijfsaccount
 * is nu nog altijd één inlog (één contactpersoon); zodra een bedrijf meerdere
 * aanspreekpunten kan hebben, is dat een eigen tabel, geen wijziging van deze pagina.
 */
export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole('admin');
  const { q } = await searchParams;
  const d = db();
  const nameFilter = q ? or(ilike(schema.users.email, `%${q}%`), ilike(schema.users.lastName, `%${q}%`), ilike(schema.users.firstName, `%${q}%`)) : undefined;

  const [pros, companies] = await Promise.all([
    d.query.users.findMany({
      where: nameFilter ? and(eq(schema.users.role, 'professional'), nameFilter) : eq(schema.users.role, 'professional'),
      orderBy: desc(schema.users.createdAt),
      limit: 50,
      with: { professionalProfile: true, verifications: true }
    }),
    d.query.users.findMany({
      where: nameFilter ? and(eq(schema.users.role, 'company'), nameFilter) : eq(schema.users.role, 'company'),
      orderBy: desc(schema.users.createdAt),
      limit: 50,
      with: { companyProfile: true, verifications: true }
    })
  ]);

  const proProfileIds = pros.map((u) => u.professionalProfile?.id).filter((x): x is string => !!x);
  const appCounts = proProfileIds.length
    ? await d.select({ profileId: schema.applications.profileId, n: count() }).from(schema.applications).where(inArray(schema.applications.profileId, proProfileIds)).groupBy(schema.applications.profileId)
    : [];
  const appCountByProfile = Object.fromEntries(appCounts.map((r) => [r.profileId, r.n]));

  const companyIds = companies.map((u) => u.companyProfile?.id).filter((x): x is string => !!x);
  const projectCounts = companyIds.length
    ? await d.select({ companyId: schema.projects.companyId, n: count() }).from(schema.projects).where(and(inArray(schema.projects.companyId, companyIds), eq(schema.projects.isTemplate, false))).groupBy(schema.projects.companyId)
    : [];
  const projectCountByCompany = Object.fromEntries(projectCounts.map((r) => [r.companyId, r.n]));

  return (
    <AppShell user={user} title="Gebruikers" subtitle="Vakmensen en klanten, los van elkaar · blokkeren trekt alle sessies in en wordt vastgelegd">
      <form method="get" className="mb-5 flex gap-2"><input name="q" className="input max-w-sm" placeholder="Zoek op naam of e-mail" defaultValue={q ?? ''} /><button className="btn-dark" type="submit">Zoeken</button></form>

      <Card title={`Vakmensen (zzp'ers) · ${pros.length}`} className="mb-5">
        {pros.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wider text-faint"><th className="pb-2 pr-4">Naam</th><th className="pb-2 pr-4">Vak</th><th className="pb-2 pr-4">Plaats</th><th className="pb-2 pr-4">Identiteit</th><th className="pb-2 pr-4 text-right">Aanmeldingen</th><th className="pb-2 pr-4">Status</th><th className="pb-2"></th></tr></thead>
              <tbody className="divide-y divide-line">
                {pros.map((u) => {
                  const p = u.professionalProfile;
                  const identity = u.verifications.find((v) => v.kind === 'identity')?.status ?? 'unverified';
                  const n = p ? (appCountByProfile[p.id] ?? 0) : 0;
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3"><Link href={`/admin/gebruikers/${u.id}`} className="font-semibold text-navy hover:text-orange-700">{u.firstName} {u.lastName}</Link><div className="text-xs text-muted">{u.email}</div></td>
                      <td className="py-2.5 pr-3">{p ? (TRADE_LABELS[p.trade as Trade] ?? p.trade) : <span className="text-faint">geen profiel</span>}</td>
                      <td className="py-2.5 pr-3">{p?.city || '—'}</td>
                      <td className="py-2.5 pr-3"><StatusPill status={identity} /></td>
                      <td className="tabular py-2.5 pr-3 text-right">{n}</td>
                      <td className="py-2.5 pr-3"><AccountStatusPill status={u.status} /></td>
                      <td className="py-2.5 text-right"><div className="flex items-center justify-end gap-2"><Link href={`/admin/gebruikers/${u.id}`} className="btn-ghost btn-sm">Bewerken</Link>{u.status !== 'deleted' && <UserStatusButton id={u.id} status={u.status} />}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty>Geen vakmensen gevonden.</Empty>}
      </Card>

      <Card title={`Klanten (bedrijven) · ${companies.length}`}>
        {companies.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wider text-faint"><th className="pb-2 pr-4">Bedrijf</th><th className="pb-2 pr-4">Contactpersoon</th><th className="pb-2 pr-4">Plaats</th><th className="pb-2 pr-4">KvK-status</th><th className="pb-2 pr-4 text-right">Projecten</th><th className="pb-2 pr-4">Status</th><th className="pb-2"></th></tr></thead>
              <tbody className="divide-y divide-line">
                {companies.map((u) => {
                  const c = u.companyProfile;
                  const kvk = c?.verifiedAt ? 'verified' : (u.verifications.find((v) => v.kind === 'company')?.status ?? 'unverified');
                  const n = c ? (projectCountByCompany[c.id] ?? 0) : 0;
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3"><Link href={`/admin/gebruikers/${u.id}`} className="font-semibold text-navy hover:text-orange-700">{c?.name ?? 'geen bedrijfsprofiel'}</Link>{c?.kvkNumber && <div className="text-xs text-muted">KvK {c.kvkNumber}</div>}</td>
                      <td className="py-2.5 pr-3"><div>{u.firstName} {u.lastName}</div><div className="text-xs text-muted">{u.email}</div></td>
                      <td className="py-2.5 pr-3">{c?.city || '—'}</td>
                      <td className="py-2.5 pr-3"><StatusPill status={kvk} /></td>
                      <td className="tabular py-2.5 pr-3 text-right">{n}</td>
                      <td className="py-2.5 pr-3"><AccountStatusPill status={u.status} /></td>
                      <td className="py-2.5 text-right"><div className="flex items-center justify-end gap-2"><Link href={`/admin/gebruikers/${u.id}`} className="btn-ghost btn-sm">Bewerken</Link>{u.status !== 'deleted' && <UserStatusButton id={u.id} status={u.status} />}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty>Geen klanten gevonden.</Empty>}
      </Card>

      <p className="mt-4 text-xs text-faint">Volledige verificatiegeschiedenis en documenten staan bij <Link href="/admin/verificaties" className="font-semibold text-orange-700">Verificaties</Link>.</p>
    </AppShell>
  );
}
