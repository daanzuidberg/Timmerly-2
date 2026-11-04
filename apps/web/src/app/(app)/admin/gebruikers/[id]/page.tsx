import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { UserStatusButton } from '@/components/AdminActions';
import { AdminUserForm } from '@/components/forms/AdminUserForm';
import { ProfessionalProfileForm } from '@/components/forms/ProfessionalProfileForm';
import { CompanyProfileForm } from '@/components/forms/CompanyProfileForm';
import { adminUpdateCompanyProfile, adminUpdateProfessionalProfile } from '@/lib/actions/admin';
import { Card, Empty, Pill, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Admin-editpagina voor één account: contactgegevens plus het volledige
 * vakman- of bedrijfsprofiel, met dezelfde formulieren als de gebruiker zelf
 * ziet (maar postend naar admin-only server actions). Nodig voor support —
 * een typefout herstellen of gegevens bijwerken na telefonisch contact,
 * zonder dat de gebruiker zelf moet inloggen.
 */
export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('admin');
  const { id } = await params;
  const d = db();
  const target = await d.query.users.findFirst({
    where: eq(schema.users.id, id),
    with: { professionalProfile: true, companyProfile: true, verifications: true }
  });
  if (!target || target.role === 'admin') notFound();

  return (
    <AppShell user={user} title={`${target.firstName} ${target.lastName}`} subtitle={target.role === 'company' ? 'Klant (bedrijf)' : 'Vakman (zzp’er)'}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/admin/gebruikers" className="btn-ghost btn-sm">&larr; Terug naar overzicht</Link>
        <Pill tone={target.status === 'active' ? 'ok' : target.status === 'suspended' ? 'bad' : 'neutral'}>{target.status === 'active' ? 'Actief' : target.status === 'suspended' ? 'Geblokkeerd' : 'Verwijderd'}</Pill>
        {target.status !== 'deleted' && <UserStatusButton id={target.id} status={target.status} />}
      </div>

      <Card title="Contactgegevens" className="mb-5">
        <AdminUserForm user={{ id: target.id, firstName: target.firstName, lastName: target.lastName, email: target.email, phone: target.phone }} />
      </Card>

      {target.role === 'professional' && (
        <Card title="Vakmanprofiel" className="mb-5">
          {target.professionalProfile ? (
            <ProfessionalProfileForm
              profile={target.professionalProfile}
              phone={target.phone}
              section="all"
              formAction={adminUpdateProfessionalProfile}
              extraFields={{ userId: target.id }}
            />
          ) : <Empty>Deze vakman heeft de onboarding nog niet doorlopen — er is nog geen profiel om te bewerken.</Empty>}
        </Card>
      )}

      {target.role === 'company' && (
        <Card title="Bedrijfsprofiel" className="mb-5">
          {target.companyProfile ? (
            <CompanyProfileForm
              company={target.companyProfile}
              formAction={adminUpdateCompanyProfile}
              extraFields={{ userId: target.id }}
            />
          ) : <Empty>Dit bedrijf heeft nog geen profiel ingevuld — er is nog niets om te bewerken.</Empty>}
        </Card>
      )}

      <Card title="Verificaties">
        {target.verifications.length ? (
          <ul className="flex flex-col gap-2 text-sm">
            {target.verifications.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-card border border-line px-3 py-2">
                <span className="font-semibold capitalize">{v.kind}</span>
                <StatusPill status={v.status} />
              </li>
            ))}
          </ul>
        ) : <Empty>Nog geen verificaties.</Empty>}
        <p className="mt-3 text-xs text-faint">Verifiëren en afkeuren doe je bij <Link href="/admin/verificaties" className="font-semibold text-orange-700">Verificaties</Link>.</p>
      </Card>
    </AppShell>
  );
}
