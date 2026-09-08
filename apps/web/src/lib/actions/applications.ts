'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNull, ne, schema } from '@timmerly/db';
import { messageSchema, reviewSchema, REVIEW_CATEGORIES, timesheetEntrySchema, isoWeek, type ApplicationStage } from '@timmerly/core';
import { db } from '../db';
import { audit } from '../audit';
import { notify } from '../notify';
import { getSession, requireRole, requireUser, type SessionUser } from '../auth/session';
import { getCompanyProfile, getProfessionalProfile } from '../auth/profiles';
import { scoreFor } from '../matching';
import { fieldErrors, type ActionState } from './types';

/** Laadt een aanmelding en bepaalt of de huidige gebruiker de vakman, het bedrijf of staf is. */
export async function loadApplication(applicationId: string, user: SessionUser) {
  const app = await db().query.applications.findFirst({
    where: eq(schema.applications.id, applicationId),
    with: { project: { with: { company: { with: { user: true } } } }, profile: { with: { user: true } }, conversation: true }
  });
  if (!app) return null;
  const isPro = app.profile.userId === user.id;
  const isCompany = app.project.company.userId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';
  if (!isPro && !isCompany && !isStaff) return null;
  return { app, isPro, isCompany, isStaff };
}

/** Interesse tonen als vakman. Vereist bevestigd e-mailadres en afgeronde onboarding. */
export async function showInterest(projectId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect(`/registreren?rol=professional&next=/projecten/${projectId}`);
  if (session.role !== 'professional') return { error: 'Alleen vakmensen kunnen interesse tonen in een project.' };
  if (!session.emailVerified) return { error: 'Bevestig eerst je e-mailadres. We hebben je een link gestuurd.' };
  const profile = await getProfessionalProfile(session.id);
  if (!profile?.onboardingCompletedAt) redirect(`/onboarding?next=/projecten/${projectId}`);
  const d = db();
  const project = await d.query.projects.findFirst({ where: eq(schema.projects.id, projectId), with: { company: true } });
  if (!project || !['published', 'matching'].includes(project.status)) return { error: 'Dit project is niet (meer) open voor aanmeldingen.' };
  const existing = await d.query.applications.findFirst({ where: and(eq(schema.applications.projectId, projectId), eq(schema.applications.profileId, profile.id)) });
  if (existing) return {};
  const match = await scoreFor(profile, project);
  const [app] = await d.insert(schema.applications).values({
    projectId, profileId: profile.id, stage: 'interest', initiatedBy: 'professional', matchScore: match.score, matchReasons: match.reasons.map((r) => ({ key: r.key, label: r.label, positive: r.positive }))
  }).returning();
  await d.insert(schema.conversations).values({ applicationId: app!.id });
  await notify(project.company.userId, { type: 'interest_received', title: `${session.firstName} ${session.lastName} heeft interesse in je project`, body: `${project.title} · ${match.score}% match`, href: `/mijn-projecten/${projectId}` });
  await audit({ actorId: session.id, actorRole: 'professional', action: 'application.interest', objectType: 'application', objectId: app!.id, after: { projectId, score: match.score } });
  revalidatePath(`/projecten/${projectId}`); revalidatePath('/aanmeldingen');
  return {};
}

/** Bedrijf benadert een kandidaat voor een project (uit Smart Match of talentpool). */
export async function inviteCandidate(projectId: string, profileId: string): Promise<void> {
  const user = await requireRole('company');
  const company = await getCompanyProfile(user.id);
  const d = db();
  const project = await d.query.projects.findFirst({ where: and(eq(schema.projects.id, projectId), eq(schema.projects.companyId, company?.id ?? '')) });
  const profile = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.id, profileId) });
  if (!project || !profile) return;
  const existing = await d.query.applications.findFirst({ where: and(eq(schema.applications.projectId, projectId), eq(schema.applications.profileId, profileId)) });
  if (existing) return;
  const match = await scoreFor(profile, project);
  const [app] = await d.insert(schema.applications).values({ projectId, profileId, stage: 'contact', initiatedBy: 'company', matchScore: match.score, matchReasons: match.reasons.map((r) => ({ key: r.key, label: r.label, positive: r.positive })) }).returning();
  const [conv] = await d.insert(schema.conversations).values({ applicationId: app!.id, lastMessageAt: new Date() }).returning();
  await d.insert(schema.messages).values({ conversationId: conv!.id, senderId: user.id, kind: 'system', body: `${company!.name} heeft je benaderd voor "${project.title}". Je kunt hier direct reageren.` });
  await notify(profile.userId, { type: 'interest_received', title: `${company!.name} heeft interesse in jouw profiel`, body: `${project.title} in ${project.city}`, href: `/berichten/${app!.id}` });
  await audit({ actorId: user.id, actorRole: 'company', action: 'application.invited', objectType: 'application', objectId: app!.id });
  revalidatePath(`/mijn-projecten/${projectId}`);
}

const TRANSITIONS: Record<string, { to: ApplicationStage; by: 'pro' | 'company' | 'both' }[]> = {
  interest: [{ to: 'contact', by: 'company' }, { to: 'declined', by: 'company' }, { to: 'withdrawn', by: 'pro' }],
  contact: [{ to: 'proposal', by: 'company' }, { to: 'declined', by: 'company' }, { to: 'withdrawn', by: 'pro' }],
  proposal: [{ to: 'agreed', by: 'pro' }, { to: 'contact', by: 'pro' }, { to: 'declined', by: 'company' }, { to: 'withdrawn', by: 'pro' }],
  agreed: [{ to: 'active', by: 'company' }, { to: 'withdrawn', by: 'pro' }, { to: 'declined', by: 'company' }],
  active: [{ to: 'completed', by: 'company' }]
};

/** Eén functie voor alle stappen in de funnel; wie wat mag staat in TRANSITIONS. */
export async function advanceApplication(applicationId: string, to: ApplicationStage, extra?: { reason?: string }): Promise<{ error?: string }> {
  const user = await requireUser();
  const loaded = await loadApplication(applicationId, user);
  if (!loaded) return { error: 'Aanmelding niet gevonden.' };
  const { app, isPro, isCompany } = loaded;
  const allowed = (TRANSITIONS[app.stage] ?? []).find((t) => t.to === to && (t.by === 'both' || (t.by === 'pro' && isPro) || (t.by === 'company' && isCompany)));
  if (!allowed) return { error: `Deze stap (${app.stage} → ${to}) is niet toegestaan.` };
  const d = db();
  const set: Partial<typeof schema.applications.$inferInsert> = { stage: to };
  if (to === 'agreed') set.agreedAt = new Date();
  if (to === 'completed') set.completedAt = new Date();
  if (to === 'declined' || to === 'withdrawn') set.declineReason = extra?.reason ?? null;
  await d.update(schema.applications).set(set).where(eq(schema.applications.id, applicationId));
  if (to === 'active') await d.update(schema.projects).set({ filledCount: app.project.filledCount + 1, status: app.project.filledCount + 1 >= app.project.headcount ? 'filled' : app.project.status }).where(eq(schema.projects.id, app.projectId));
  const other = isPro ? app.project.company.userId : app.profile.userId;
  const labels: Record<string, string> = { contact: 'Het gesprek is geopend', proposal: 'Er staat een voorstel voor je klaar', agreed: 'De opdracht is akkoord', active: 'De opdracht is gestart', completed: 'De opdracht is afgerond — laat een beoordeling achter', declined: 'Je bent niet geselecteerd', withdrawn: 'De kandidaat heeft zich teruggetrokken' };
  await notify(other, { type: 'application_stage', title: labels[to] ?? 'Status gewijzigd', body: app.project.title, href: isPro ? `/mijn-projecten/${app.projectId}` : `/aanmeldingen` });
  await audit({ actorId: user.id, actorRole: user.role, action: 'application.stage', objectType: 'application', objectId: applicationId, before: { stage: app.stage }, after: { stage: to } });
  revalidatePath('/aanmeldingen'); revalidatePath(`/mijn-projecten/${app.projectId}`); revalidatePath(`/berichten/${applicationId}`);
  return {};
}

export async function sendProposal(applicationId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('company');
  const loaded = await loadApplication(applicationId, user);
  if (!loaded?.isCompany) return { error: 'Geen toegang.' };
  const rate = Number(form.get('hourlyRate'));
  const hours = Number(form.get('hoursPerWeek'));
  const startDate = String(form.get('startDate') ?? '');
  if (!(rate > 0 && rate < 500)) return { fieldErrors: { hourlyRate: 'Vul een uurtarief in' } };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { fieldErrors: { startDate: 'Vul een startdatum in' } };
  const proposal = { hourlyRate: rate, contractType: String(form.get('contractType') ?? loaded.app.project.contractType), startDate, endDate: String(form.get('endDate') ?? '') || undefined, hoursPerWeek: hours || loaded.app.project.hoursPerWeek, notes: String(form.get('notes') ?? '') };
  await db().update(schema.applications).set({ proposal }).where(eq(schema.applications.id, applicationId));
  const r = await advanceApplication(applicationId, 'proposal');
  if (r.error) return { error: r.error };
  const conv = loaded.app.conversation;
  if (conv) await db().insert(schema.messages).values({ conversationId: conv.id, senderId: user.id, kind: 'system', body: `Voorstel verstuurd: €${rate} per uur, ${proposal.hoursPerWeek} uur per week, start ${startDate}${proposal.endDate ? ` tot ${proposal.endDate}` : ''}. ${proposal.notes}`.trim() });
  return { ok: true };
}

export async function sendMessage(applicationId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const loaded = await loadApplication(applicationId, user);
  if (!loaded || loaded.isStaff) return { error: 'Geen toegang tot dit gesprek.' };
  const parsed = messageSchema.safeParse({ body: form.get('body') });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (['declined', 'withdrawn'].includes(loaded.app.stage)) return { error: 'Dit gesprek is gesloten.' };
  const d = db();
  const conv = loaded.app.conversation ?? (await d.insert(schema.conversations).values({ applicationId }).returning())[0]!;
  await d.insert(schema.messages).values({ conversationId: conv.id, senderId: user.id, body: parsed.data.body });
  await d.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conv.id));
  // Eerste bericht van het bedrijf opent formeel het gesprek.
  if (loaded.isCompany && loaded.app.stage === 'interest') await advanceApplication(applicationId, 'contact');
  const other = loaded.isPro ? loaded.app.project.company.userId : loaded.app.profile.userId;
  await notify(other, { type: 'message', title: `Nieuw bericht van ${user.firstName}`, body: parsed.data.body.slice(0, 120), href: `/berichten/${applicationId}` });
  revalidatePath(`/berichten/${applicationId}`);
  return { ok: true };
}

export async function markConversationRead(applicationId: string): Promise<void> {
  const user = await requireUser();
  const loaded = await loadApplication(applicationId, user);
  if (!loaded?.app.conversation) return;
  await db().update(schema.messages).set({ readAt: new Date() }).where(and(eq(schema.messages.conversationId, loaded.app.conversation.id), ne(schema.messages.senderId, user.id), isNull(schema.messages.readAt)));
}

// ── Uren ──────────────────────────────────────────────────────────────────
export async function saveTimesheetEntry(applicationId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('professional');
  const loaded = await loadApplication(applicationId, user);
  if (!loaded?.isPro || loaded.app.stage !== 'active') return { error: 'Uren kunnen alleen op een lopende opdracht.' };
  const parsed = timesheetEntrySchema.safeParse({ date: form.get('date'), startTime: form.get('startTime'), endTime: form.get('endTime'), breakMinutes: form.get('breakMinutes'), note: form.get('note') });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const minutes = toMin(v.endTime) - toMin(v.startTime) - v.breakMinutes;
  if (minutes <= 0 || minutes > 16 * 60) return { fieldErrors: { endTime: 'Controleer begin- en eindtijd' } };
  const { year, week } = isoWeek(v.date);
  const d = db();
  let ts = await d.query.timesheets.findFirst({ where: and(eq(schema.timesheets.applicationId, applicationId), eq(schema.timesheets.isoYear, year), eq(schema.timesheets.isoWeek, week)) });
  if (!ts) [ts] = await d.insert(schema.timesheets).values({ applicationId, isoYear: year, isoWeek: week }).returning();
  if (ts!.status === 'approved') return { error: 'Deze week is al goedgekeurd.' };
  await d.insert(schema.timesheetEntries).values({ timesheetId: ts!.id, day: v.date, startTime: v.startTime, endTime: v.endTime, breakMinutes: v.breakMinutes, minutes, note: v.note })
    .onConflictDoUpdate({ target: [schema.timesheetEntries.timesheetId, schema.timesheetEntries.day], set: { startTime: v.startTime, endTime: v.endTime, breakMinutes: v.breakMinutes, minutes, note: v.note } });
  await recalcTimesheet(ts!.id);
  if (ts!.status === 'rejected') await d.update(schema.timesheets).set({ status: 'draft' }).where(eq(schema.timesheets.id, ts!.id));
  revalidatePath(`/uren/${applicationId}`);
  return { ok: true };
}

async function recalcTimesheet(timesheetId: string) {
  const d = db();
  const entries = await d.select().from(schema.timesheetEntries).where(eq(schema.timesheetEntries.timesheetId, timesheetId));
  await d.update(schema.timesheets).set({ totalMinutes: entries.reduce((s, e) => s + e.minutes, 0) }).where(eq(schema.timesheets.id, timesheetId));
}

export async function submitTimesheet(timesheetId: string): Promise<void> {
  const user = await requireRole('professional');
  const ts = await db().query.timesheets.findFirst({ where: eq(schema.timesheets.id, timesheetId), with: { application: { with: { project: { with: { company: true } } } } } });
  if (!ts) return;
  const loaded = await loadApplication(ts.applicationId, user);
  if (!loaded?.isPro || ts.status === 'approved') return;
  await db().update(schema.timesheets).set({ status: 'submitted', submittedAt: new Date() }).where(eq(schema.timesheets.id, timesheetId));
  await notify(ts.application.project.company.userId, { type: 'timesheet', title: `Uren ingediend: week ${ts.isoWeek}`, body: `${user.firstName} ${user.lastName} · ${(ts.totalMinutes / 60).toFixed(1).replace('.', ',')} uur · ${ts.application.project.title}`, href: `/uren/${ts.applicationId}` });
  revalidatePath(`/uren/${ts.applicationId}`);
}

export async function decideTimesheet(timesheetId: string, decision: 'approved' | 'rejected', note: string): Promise<void> {
  const user = await requireRole('company');
  const ts = await db().query.timesheets.findFirst({ where: eq(schema.timesheets.id, timesheetId), with: { application: { with: { profile: true, project: true } } } });
  if (!ts) return;
  const loaded = await loadApplication(ts.applicationId, user);
  if (!loaded?.isCompany || ts.status !== 'submitted') return;
  if (decision === 'rejected' && note.trim().length < 5) return;
  await db().update(schema.timesheets).set({ status: decision, decidedBy: user.id, decidedAt: new Date(), decisionNote: note || null }).where(eq(schema.timesheets.id, timesheetId));
  await notify(ts.application.profile.userId, { type: 'timesheet', title: decision === 'approved' ? `Je uren van week ${ts.isoWeek} zijn goedgekeurd` : `Je uren van week ${ts.isoWeek} zijn afgewezen`, body: note || ts.application.project.title, href: `/uren/${ts.applicationId}` });
  await audit({ actorId: user.id, actorRole: 'company', action: `timesheet.${decision}`, objectType: 'timesheet', objectId: timesheetId, after: { note } });
  revalidatePath(`/uren/${ts.applicationId}`);
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h! * 60 + m!;
}

// ── Reviews ───────────────────────────────────────────────────────────────
export async function submitReview(applicationId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const loaded = await loadApplication(applicationId, user);
  if (!loaded || loaded.isStaff) return { error: 'Geen toegang.' };
  if (!['completed', 'reviewed'].includes(loaded.app.stage)) return { error: 'Beoordelen kan pas na afronding van de opdracht.' };
  const direction = loaded.isPro ? 'professional_to_company' : 'company_to_professional';
  const cats = REVIEW_CATEGORIES[direction];
  const scores: Record<string, unknown> = {};
  for (const c of cats) scores[c] = form.get(`score.${c}`);
  const parsed = reviewSchema.safeParse({ scores, comment: form.get('comment') });
  if (!parsed.success || cats.some((c) => !parsed.data.scores[c])) return { error: 'Geef elke categorie een score van 1 tot 5.' };
  const values = Object.values(parsed.data.scores);
  const overall = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10);
  const subjectId = loaded.isPro ? loaded.app.project.company.userId : loaded.app.profile.userId;
  const d = db();
  const existing = await d.query.reviews.findFirst({ where: and(eq(schema.reviews.applicationId, applicationId), eq(schema.reviews.direction, direction)) });
  if (existing) return { error: 'Je hebt deze opdracht al beoordeeld.' };
  await d.insert(schema.reviews).values({ applicationId, direction, authorId: user.id, subjectId, scores: parsed.data.scores, overall, comment: parsed.data.comment });
  const both = await d.select().from(schema.reviews).where(eq(schema.reviews.applicationId, applicationId));
  if (both.length >= 2) await d.update(schema.applications).set({ stage: 'reviewed' }).where(eq(schema.applications.id, applicationId));
  await notify(subjectId, { type: 'review_request', title: `${user.firstName} heeft een beoordeling achtergelaten`, body: `${(overall / 10).toFixed(1).replace('.', ',')} gemiddeld · ${loaded.app.project.title}`, href: '/profiel' });
  await refreshTrustScore(loaded.app.profile.id);
  revalidatePath('/aanmeldingen'); revalidatePath(`/mijn-projecten/${loaded.app.projectId}`);
  return { ok: true };
}

/**
 * Trustscore (intern): verificaties, reviews, afgeronde projecten, meldingen.
 * Alleen een grove versie ("Hoog") is zichtbaar voor anderen.
 */
export async function refreshTrustScore(profileId: string): Promise<void> {
  const d = db();
  const p = await d.query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.id, profileId), with: { user: { with: { verifications: true, reviewsReceived: true } }, certificates: true } });
  if (!p) return;
  const ver = p.user.verifications.filter((v) => v.status === 'verified').map((v) => v.kind);
  const reviews = p.user.reviewsReceived.filter((r) => !r.hiddenAt);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.overall, 0) / reviews.length / 10 : null;
  const completed = await d.select().from(schema.applications).where(and(eq(schema.applications.profileId, profileId), eq(schema.applications.stage, 'reviewed')));
  const reports = await d.select().from(schema.reports).where(and(eq(schema.reports.targetUserId, p.userId), eq(schema.reports.status, 'resolved')));
  let score = 30;
  score += ver.includes('email') ? 5 : 0; score += ver.includes('phone') ? 5 : 0; score += ver.includes('identity') ? 15 : 0; score += ver.includes('zzp') ? 10 : 0;
  score += p.certificates.some((c) => c.status === 'verified') ? 10 : 0;
  score += avg ? Math.round(((avg - 3) / 2) * 15) : 0;
  score += Math.min(10, completed.length * 2);
  score -= reports.length * 15;
  await d.update(schema.professionalProfiles).set({ trustScore: Math.max(0, Math.min(100, score)) }).where(eq(schema.professionalProfiles.id, profileId));
}
