import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq, inArray, schema } from '@timmerly/db';
import { PLACE_COORDS, distanceKm } from '@timmerly/core';
import { db } from '@/lib/db';
import { ProjectCard } from '@/components/ProjectCard';

/**
 * SEO-landingspagina's per plaats ("timmerman gezocht Zwolle"). Eén sjabloon met
 * echte, actuele projecten binnen 40 km — geen duplicate content: pagina's
 * zonder projecten krijgen noindex.
 */
export const dynamic = 'force-dynamic';

function place(slug: string) {
  const key = slug.replace(/-/g, ' ').toLowerCase();
  const coords = PLACE_COORDS[key];
  return coords ? { key, name: key.replace(/\b\w/g, (c) => c.toUpperCase()), ...coords } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ plaats: string }> }) {
  const p = place((await params).plaats);
  if (!p) return { title: 'Timmerman gezocht' };
  const n = (await nearby(p)).length;
  return { title: `Timmerman gezocht in ${p.name} — ${n} projecten`, description: `Actuele projecten voor zzp-timmermannen en timmermannen in loondienst in en rond ${p.name}. Geverifieerde aannemers, uitgelegde matchscores.`, robots: n === 0 ? { index: false } : undefined };
}

async function nearby(p: { lat: number; lng: number }) {
  const rows = await db().query.projects.findMany({ where: and(inArray(schema.projects.status, ['published', 'matching']), eq(schema.projects.isTemplate, false)), with: { company: { columns: { name: true, verifiedAt: true } } } });
  return rows.map((r) => ({ r, km: r.lat != null && r.lng != null ? Math.round(distanceKm(p, { lat: r.lat, lng: r.lng })) : null })).filter((x) => x.km !== null && x.km <= 40).sort((a, b) => a.km! - b.km!);
}

export default async function CityPage({ params }: { params: Promise<{ plaats: string }> }) {
  const p = place((await params).plaats);
  if (!p) notFound();
  const items = await nearby(p);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="eyebrow mb-2 text-orange-700">{p.province}</div>
      <h1 className="h1">Timmerman gezocht in {p.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{items.length} {items.length === 1 ? 'project' : 'projecten'} binnen 40 km van {p.name}. Aannemers op Timmerly zijn geverifieerd op KvK; je ziet bij elk project vooraf tarief, looptijd en eisen.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{items.map((i) => <ProjectCard key={i.r.id} project={i.r} distanceKm={i.km} />)}</div>
      <div className="mt-10 rounded-card bg-navy p-8 text-white">
        <h2 className="h2">Werk je als timmerman in de regio {p.name}?</h2>
        <p className="mt-2 max-w-xl text-white/75">Maak één keer je profiel en ontvang alleen projecten die bij je vak, reisafstand en beschikbaarheid passen.</p>
        <Link href="/registreren?rol=professional" className="btn-primary mt-5">Gratis profiel aanmaken</Link>
      </div>
    </div>
  );
}
