import 'server-only';
import { and, desc, eq, gte, inArray, lte, schema, ilike, or, sql } from '@timmerly/db';
import { addDays, distanceKm, todayIso } from '@timmerly/core';
import type { z } from 'zod';
import type { projectSearchSchema } from '@timmerly/core';
import { db } from '../db';
import { projectsForProfessional } from '../matching';

type Filters = z.infer<typeof projectSearchSchema>;
type ProfileRow = typeof schema.professionalProfiles.$inferSelect;

/**
 * Publieke projectzoekfunctie. Filters gaan naar SQL; afstand en matchscore
 * worden daarna in-memory bepaald op de (kleine) gefilterde set. Bij groei
 * verhuist de afstandsfilter naar PostGIS en de score naar een matches-tabel.
 */
export async function searchProjects(filters: Filters, viewer?: ProfileRow | null) {
  const conds = [inArray(schema.projects.status, ['published', 'matching']), eq(schema.projects.isTemplate, false)];
  if (filters.trade) conds.push(eq(schema.projects.trade, filters.trade));
  if (filters.specialism) conds.push(sql`${filters.specialism} = any(${schema.projects.specialisms})`);
  if (filters.province) conds.push(eq(schema.projects.province, filters.province));
  if (filters.contractType) conds.push(filters.contractType === 'either' ? eq(schema.projects.contractType, 'either') : or(eq(schema.projects.contractType, filters.contractType), eq(schema.projects.contractType, 'either'))!);
  if (filters.startWithinDays !== undefined) conds.push(lte(schema.projects.startDate, addDays(todayIso(), filters.startWithinDays)));
  if (filters.minRate) conds.push(gte(schema.projects.rateMax, filters.minRate));
  if (filters.q) conds.push(or(ilike(schema.projects.title, `%${filters.q}%`), ilike(schema.projects.city, `%${filters.q}%`), ilike(schema.projects.description, `%${filters.q}%`))!);

  const rows = await db().query.projects.findMany({ where: and(...conds), orderBy: [desc(schema.projects.featuredUntil), desc(schema.projects.publishedAt)], limit: 200, with: { company: { columns: { name: true, verifiedAt: true } } } });

  const origin = viewer?.lat != null && viewer?.lng != null ? { lat: viewer.lat, lng: viewer.lng } : null;
  let items = rows.map((p) => ({ project: p, distanceKm: origin && p.lat != null && p.lng != null ? Math.round(distanceKm(origin, { lat: p.lat, lng: p.lng })) : null, score: null as number | null }));
  if (filters.maxKm && origin) items = items.filter((i) => i.distanceKm !== null && i.distanceKm <= filters.maxKm!);

  if (viewer) {
    const ranked = await projectsForProfessional(viewer, rows);
    const scores = new Map(ranked.map((r) => [r.project.id, r.match.score]));
    for (const i of items) i.score = scores.get(i.project.id) ?? null;
  }
  if (filters.sort === 'match' && viewer) items.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  else if (filters.sort === 'start') items.sort((a, b) => a.project.startDate.localeCompare(b.project.startDate));
  return items;
}
