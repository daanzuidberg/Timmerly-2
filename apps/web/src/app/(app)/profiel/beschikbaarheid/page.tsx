import { redirect } from 'next/navigation';
import { and, eq, gte, lte, schema, inArray } from '@timmerly/db';
import type { AvailabilityStatus } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { AvailabilityCalendar, AvailabilityToggle } from '@/components/AvailabilityControls';
import { ProfessionalProfileForm } from '@/components/forms/ProfessionalProfileForm';
import { Card } from '@/components/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ maand?: string }> }) {
  const user = await requireRole('professional');
  const profile = await getProfessionalProfile(user.id);
  if (!profile) redirect('/onboarding');
  const { maand } = await searchParams;
  const now = new Date();
  const [y, m] = (maand && /^\d{4}-\d{2}$/.test(maand) ? maand : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`).split('-').map(Number) as [number, number];
  const from = `${y}-${String(m).padStart(2, '0')}-01`, to = `${y}-${String(m).padStart(2, '0')}-31`;
  const d = db();
  const rows = await d.query.availabilityDays.findMany({ where: and(eq(schema.availabilityDays.profileId, profile.id), gte(schema.availabilityDays.day, from), lte(schema.availabilityDays.day, to)) });
  const active = await d.query.applications.findMany({ where: and(eq(schema.applications.profileId, profile.id), inArray(schema.applications.stage, ['agreed', 'active'])), with: { project: { columns: { startDate: true, endDate: true } } } });
  const booked: string[] = [];
  for (const a of active) { const s = a.proposal?.startDate ?? a.project.startDate, e = a.proposal?.endDate ?? a.project.endDate ?? to; for (let day = 1; day <= 31; day++) { const iso = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`; if (iso >= s && iso <= e) booked.push(iso); } }
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`, next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return (
    <AppShell user={user} title="Beschikbaarheid" subtitle="Aannemers zoeken op “beschikbaar vanaf”; houd dit actueel">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card title={`${months[m - 1]} ${y}`} action={<div className="flex gap-2"><Link href={`?maand=${prev}`} className="btn-secondary btn-sm">‹</Link><Link href={`?maand=${next}`} className="btn-secondary btn-sm">›</Link></div>}>
          <AvailabilityCalendar year={y} month={m} days={Object.fromEntries(rows.map((r) => [r.day, r.status as AvailabilityStatus]))} booked={booked} />
          <p className="mt-3 text-sm text-muted">Klik op een dag om te wisselen. Dagen zonder kleur volgen je algemene status.</p>
        </Card>
        <div className="flex flex-col gap-5">
          <Card title="Algemene status"><AvailabilityToggle current={profile.availability} /></Card>
          <Card title="Vanaf wanneer en hoeveel"><ProfessionalProfileForm profile={profile} section="availability" /></Card>
        </div>
      </div>
    </AppShell>
  );
}
