import { redirect } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { createProject } from '@/lib/actions/projects';
import { AppShell } from '@/components/AppShell';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { CompanyVerificationGate } from '@/components/CompanyVerificationGate';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf?nieuw=1&next=/projecten/nieuw');

  if (!company.verifiedAt) {
    const v = await db().query.verifications.findFirst({ where: and(eq(schema.verifications.userId, user.id), eq(schema.verifications.kind, 'company')) });
    return (
      <AppShell user={user} title="Project plaatsen" subtitle="Eerst verifiëren we je bedrijfsgegevens">
        <CompanyVerificationGate status={v?.status ?? 'pending'} note={v?.note} />
      </AppShell>
    );
  }

  const templates = await db().query.projects.findMany({ where: and(eq(schema.projects.companyId, company.id), eq(schema.projects.isTemplate, true)) });
  return (
    <AppShell user={user} title="Project plaatsen" subtitle="Nieuwe aanvraag in drie stappen">
      <div className="max-w-3xl"><ProjectForm action={createProject} templates={templates.map((t) => ({ id: t.id, name: t.templateName ?? t.title, data: { ...t, endDate: t.endDate, province: t.province } }))} submitLabel="Project opslaan en controleren" /></div>
    </AppShell>
  );
}
