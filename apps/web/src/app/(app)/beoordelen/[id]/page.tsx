import { notFound } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { REVIEW_CATEGORIES } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { loadApplication } from '@/lib/actions/applications';
import { AppShell } from '@/components/AppShell';
import { ReviewForm } from '@/components/forms/ReviewForm';
import { Alert, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id, user);
  if (!loaded || loaded.isStaff) notFound();
  const { app, isPro } = loaded;
  const direction = isPro ? 'professional_to_company' : 'company_to_professional';
  const existing = await db().query.reviews.findFirst({ where: and(eq(schema.reviews.applicationId, id), eq(schema.reviews.direction, direction)) });
  const subject = isPro ? app.project.company.name : `${app.profile.user.firstName} ${app.profile.user.lastName}`;
  return (
    <AppShell user={user} title={`Beoordeel ${subject}`} subtitle={app.project.title}>
      <div className="max-w-2xl">
        {!['completed', 'reviewed'].includes(app.stage) ? <Alert tone="warn">Beoordelen kan pas nadat de opdrachtgever de opdracht heeft afgerond.</Alert> : existing ? <Alert tone="ok">Je hebt deze opdracht al beoordeeld ({(existing.overall / 10).toFixed(1).replace('.', ',')} gemiddeld).</Alert> : (
          <Card title="Jouw beoordeling"><p className="mb-4 text-sm text-muted">Eerlijk en concreet helpt het meest. Reviews zijn gekoppeld aan deze opdracht en worden gemodereerd; misbruik wordt verwijderd.</p><ReviewForm applicationId={id} categories={REVIEW_CATEGORIES[direction]} subject={subject} /></Card>
        )}
      </div>
    </AppShell>
  );
}
