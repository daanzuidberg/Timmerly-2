import { redirect } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { ZzpForm } from '@/components/forms/ZzpForm';
import { Card, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ZzpPage() {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const v = await db().query.verifications.findFirst({ where: and(eq(schema.verifications.userId, user.id), eq(schema.verifications.kind, 'zzp')) });
  return (
    <AppShell user={user} title="ZZP-gegevens" subtitle="Ondernemingsgegevens voor de ZZP-verificatie">
      <div className="max-w-2xl">
        <Card title="Status" action={<StatusPill status={v?.status ?? 'unverified'} />}>{v?.note && <p className="text-sm text-muted">{v.note}</p>}{!v && <p className="text-sm text-muted">Nog niet ingediend.</p>}</Card>
        <Card className="mt-5" title="Onderneming"><ZzpForm zzp={profile.zzp} /></Card>
      </div>
    </AppShell>
  );
}
