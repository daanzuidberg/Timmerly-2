'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, schema } from '@timmerly/db';
import { geocode, projectSchema } from '@timmerly/core';
import { screenProject } from '@timmerly/compliance';
import { db } from '../db';
import { audit } from '../audit';
import { notify } from '../notify';
import { requireRole } from '../auth/session';
import { getCompanyProfile } from '../auth/profiles';
import { candidatesForProject } from '../matching';
import { fieldErrors, formToObject, type ActionState } from './types';

async function ownedProject(projectId: string) {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf');
  const project = await db().query.projects.findFirst({ where: and(eq(schema.projects.id, projectId), eq(schema.projects.companyId, company.id)) });
  if (!project) redirect('/mijn-projecten');
  return { user, company, project };
}

function parseProject(form: FormData) {
  const raw = formToObject(form);
  return {
    raw,
    parsed: projectSchema.safeParse({
      ...raw, specialisms: raw.specialisms ?? [], requiredCertificates: raw.requiredCertificates ?? [],
      requiresOwnTransport: raw.requiresOwnTransport === 'on', requiresOwnTools: raw.requiresOwnTools === 'on', housingAvailable: raw.housingAvailable === 'on',
      endDate: raw.endDate || null, rateMin: raw.rateMin === '' ? null : raw.rateMin, rateMax: raw.rateMax === '' ? null : raw.rateMax
    })
  };
}

export async function createProject(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  if (!company) redirect('/bedrijf?next=/projecten/nieuw');
  // Ook hier bewaken, niet alleen op de pagina: een geverifieerd bedrijf is de voorwaarde om te kunnen plaatsen.
  if (!company.verifiedAt) redirect('/projecten/nieuw');
  const { raw, parsed } = parseProject(form);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const geo = geocode(v.city);
  const asTemplate = raw.saveAsTemplate === 'on';
  const [project] = await db().insert(schema.projects).values({
    companyId: company.id, ...v, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, endDate: v.endDate ?? null,
    rateMin: v.rateMin ?? null, rateMax: v.rateMax ?? null, status: 'draft', isTemplate: false
  }).returning();
  if (asTemplate) {
    await db().insert(schema.projects).values({ companyId: company.id, ...v, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, endDate: v.endDate ?? null, rateMin: v.rateMin ?? null, rateMax: v.rateMax ?? null, status: 'draft', isTemplate: true, templateName: v.title });
  }
  await audit({ actorId: user.id, actorRole: 'company', action: 'project.created', objectType: 'project', objectId: project!.id });
  redirect(`/mijn-projecten/${project!.id}?nieuw=1`);
}

export async function updateProject(projectId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, project } = await ownedProject(projectId);
  const { parsed } = parseProject(form);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const geo = geocode(v.city);
  // Een gepubliceerd project gaat na een inhoudelijke wijziging terug naar beoordeling.
  const status = project.status === 'published' || project.status === 'matching' ? 'in_review' : project.status;
  await db().update(schema.projects).set({ ...v, province: v.province ?? geo?.province ?? null, lat: geo?.lat ?? null, lng: geo?.lng ?? null, endDate: v.endDate ?? null, rateMin: v.rateMin ?? null, rateMax: v.rateMax ?? null, status }).where(eq(schema.projects.id, projectId));
  await audit({ actorId: user.id, actorRole: 'company', action: 'project.updated', objectType: 'project', objectId: projectId, before: { status: project.status }, after: { status } });
  revalidatePath(`/mijn-projecten/${projectId}`);
  redirect(`/mijn-projecten/${projectId}`);
}

/**
 * Indienen ter publicatie. Een bedrijf kan pas een project aanmaken na
 * verificatie (zie createProject), dus dit publiceert vrijwel altijd direct.
 * De in_review-tak blijft bestaan als vangnet: verlies je je verificatie
 * later (bv. na een KvK-wijziging) dan gaat een nog openstaand concept
 * alsnog eerst langs het Timmerly-team in plaats van direct live.
 */
export async function submitProject(projectId: string): Promise<void> {
  const { user, company, project } = await ownedProject(projectId);
  if (!['draft', 'in_review'].includes(project.status)) return;
  const direct = !!company.verifiedAt;
  const status = direct ? 'published' : 'in_review';
  await db().update(schema.projects).set({ status, publishedAt: direct ? new Date() : null }).where(eq(schema.projects.id, projectId));
  await audit({ actorId: user.id, actorRole: 'company', action: direct ? 'project.published' : 'project.submitted', objectType: 'project', objectId: projectId, before: { status: project.status }, after: { status } });
  if (direct) await notifyMatches(projectId);
  revalidatePath(`/mijn-projecten/${projectId}`); revalidatePath('/projecten');
}

/** Matchmeldingen naar de beste kandidaten. Alleen echt goede matches (≥ 75) — kwaliteit boven kwantiteit. */
export async function notifyMatches(projectId: string): Promise<number> {
  const project = await db().query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
  if (!project) return 0;
  const ranked = await candidatesForProject(project, 10);
  let n = 0;
  for (const r of ranked) {
    if (r.match.score < 75) continue;
    await notify(r.profile.userId, { type: 'match_found', title: 'Nieuw project past bij je profiel', body: `${project.title} in ${project.city}, ${r.match.score}% match.`, href: `/projecten/${project.id}` });
    n++;
  }
  return n;
}

export async function setProjectStatus(projectId: string, status: 'filled' | 'completed' | 'cancelled'): Promise<void> {
  const { user, project } = await ownedProject(projectId);
  await db().update(schema.projects).set({ status }).where(eq(schema.projects.id, projectId));
  await audit({ actorId: user.id, actorRole: 'company', action: 'project.status', objectType: 'project', objectId: projectId, before: { status: project.status }, after: { status } });
  revalidatePath(`/mijn-projecten/${projectId}`); revalidatePath('/mijn-projecten');
}

export async function complianceHints(projectId: string): Promise<string[]> {
  const project = await db().query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
  if (!project) return [];
  return screenProject({ contractType: project.contractType, hoursPerWeek: project.hoursPerWeek, startDate: project.startDate, endDate: project.endDate, requiresOwnTools: project.requiresOwnTools, description: project.description });
}
