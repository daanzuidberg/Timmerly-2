import { notFound, redirect } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getCompanyProfile } from '@/lib/auth/profiles';
import { updateProject } from '@/lib/actions/projects';
import { AppShell } from '@/components/AppShell';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { Alert } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf');
  const { id } = await params;
  const project = await db().query.projects.findFirst({ where: and(eq(schema.projects.id, id), eq(schema.projects.companyId, company.id)) });
  if (!project) notFound();
  return (
    <AppShell user={user} title="Project bewerken" subtitle={project.title}>
      <div className="max-w-3xl">
        {['published', 'matching'].includes(project.status) && <div className="mb-5"><Alert tone="warn">Een gepubliceerd project gaat na een inhoudelijke wijziging opnieuw langs de beoordeling.</Alert></div>}
        <ProjectForm action={updateProject.bind(null, id)} project={project} submitLabel="Wijzigingen opslaan" />
      </div>
    </AppShell>
  );
}
