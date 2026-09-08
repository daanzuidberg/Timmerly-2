import Link from 'next/link';
import { projectSearchSchema } from '@timmerly/core';
import { getSession } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { searchProjects } from '@/lib/search/projects';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectFilters } from '@/components/ProjectFilters';
import { Empty } from '@/components/ui';

export const metadata = { title: 'Projecten voor timmermannen', description: 'Actuele bouwprojecten voor zzp-timmermannen en timmermannen in loondienst, door heel Nederland. Filter op regio, soort werk, startdatum en tarief.' };
export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const parsed = projectSearchSchema.safeParse(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
  const filters = parsed.success ? parsed.data : projectSearchSchema.parse({});
  const session = await getSession();
  const viewer = session?.role === 'professional' ? await getProfessionalProfile(session.id) : null;
  const items = await searchProjects(filters, viewer);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="h1">Projecten voor timmermannen</h1>
      <p className="mt-1 text-muted">{items.length} {items.length === 1 ? 'project' : 'projecten'}{viewer ? ' · gesorteerd op match met je profiel' : ''}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <ProjectFilters values={params} hasViewer={!!viewer} />
        <div>
          {items.length === 0 ? (
            <Empty>Geen projecten gevonden met deze filters. <Link href="/projecten">Filters wissen</Link></Empty>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((i) => <ProjectCard key={i.project.id} project={i.project} score={i.score ?? undefined} distanceKm={i.distanceKm} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
