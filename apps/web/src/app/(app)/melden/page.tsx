import { requireUser } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { ReportForm } from '@/components/forms/ReportForm';
import { Card } from '@/components/ui';

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ user?: string; project?: string }> }) {
  const user = await requireUser();
  const q = await searchParams;
  return (
    <AppShell user={user} title="Iets melden" subtitle="Meldingen worden vertrouwelijk behandeld en vastgelegd">
      <div className="max-w-xl"><Card><ReportForm targetUserId={q.user} targetProjectId={q.project} /></Card></div>
    </AppShell>
  );
}
