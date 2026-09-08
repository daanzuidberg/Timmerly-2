import type { MetadataRoute } from 'next';
import { eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { PLACE_COORDS } from '@timmerly/core';

// Projecten wijzigen continu; per request opbouwen in plaats van bevriezen op
// het moment van de build. Voorkomt ook dat de build zelf een databaseverbinding
// nodig heeft (die tijdens `next build` niet gegarandeerd beschikbaar is).
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const pages = ['', '/projecten', '/hoe-het-werkt', '/voor-opdrachtgevers', '/zzp-check', '/over-timmerly', '/prijzen', '/privacy', '/voorwaarden', '/support', '/verificatie'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const }));
  const projects = await db().query.projects.findMany({ where: eq(schema.projects.status, 'published'), columns: { id: true, updatedAt: true } });
  const cities = Object.keys(PLACE_COORDS).map((c) => ({ url: `${base}/timmerman-gezocht/${c.replace(/ /g, '-')}`, changeFrequency: 'weekly' as const }));
  return [...pages, ...projects.map((p) => ({ url: `${base}/projecten/${p.id}`, lastModified: p.updatedAt, changeFrequency: 'daily' as const })), ...cities];
}
