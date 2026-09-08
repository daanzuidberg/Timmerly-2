import { boolean, date, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_shared';
import { applicationStage, contractType, projectStatus, timesheetStatus } from './enums';
import { users } from './auth';
import { companyProfiles, professionalProfiles, trades } from './profiles';

export const projects = pgTable(
  'projects',
  {
    id: id(),
    companyId: uuid('company_id').notNull().references(() => companyProfiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    trade: text('trade').notNull().references(() => trades.slug),
    specialisms: text('specialisms').array().notNull().default([]),
    city: text('city').notNull(),
    province: text('province'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    headcount: integer('headcount').notNull().default(1),
    filledCount: integer('filled_count').notNull().default(0),
    hoursPerWeek: integer('hours_per_week').notNull().default(40),
    workingHours: text('working_hours').notNull().default(''),
    minYearsExperience: integer('min_years_experience').notNull().default(0),
    requiredCertificates: text('required_certificates').array().notNull().default([]),
    requiresOwnTransport: boolean('requires_own_transport').notNull().default(false),
    requiresOwnTools: boolean('requires_own_tools').notNull().default(false),
    contractType: contractType('contract_type').notNull().default('either'),
    rateMin: integer('rate_min'),
    rateMax: integer('rate_max'),
    housingAvailable: boolean('housing_available').notNull().default(false),
    travelAllowance: text('travel_allowance').notNull().default(''),
    notes: text('notes').notNull().default(''),
    status: projectStatus('status').notNull().default('draft'),
    // Sjabloon: hetzelfde record, maar niet zichtbaar in zoeken.
    isTemplate: boolean('is_template').notNull().default(false),
    templateName: text('template_name'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    // Uitgelicht project (verdienmodel): sortering, geen matchingvoordeel.
    featuredUntil: timestamp('featured_until', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note'),
    ...timestamps
  },
  (t) => [
    index('projects_company_idx').on(t.companyId),
    index('projects_status_start_idx').on(t.status, t.startDate),
    index('projects_trade_idx').on(t.trade),
    index('projects_geo_idx').on(t.lat, t.lng)
  ]
);

/**
 * Eén rij per (project, vakman) zodra er iets gebeurt: de funnel van interesse
 * tot review. `initiatedBy` legt vast wie de eerste stap zette.
 */
export const applications = pgTable(
  'applications',
  {
    id: id(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
    stage: applicationStage('stage').notNull().default('interest'),
    initiatedBy: text('initiated_by').notNull(), // 'professional' | 'company' | 'platform'
    // Matchscore op het moment van interesse, met uitleg — voor de gebruiker én voor evaluatie van het algoritme.
    matchScore: integer('match_score'),
    matchReasons: jsonb('match_reasons').$type<Array<{ key: string; label: string; positive: boolean }>>().notNull().default([]),
    // Voorstel: tarief, looptijd, uren, contractvorm. Vastgelegd bij stage 'proposal'.
    proposal: jsonb('proposal').$type<{
      hourlyRate: number; contractType: string; startDate: string; endDate?: string; hoursPerWeek: number; notes?: string;
    } | null>(),
    agreedAt: timestamp('agreed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    declineReason: text('decline_reason'),
    ...timestamps
  },
  (t) => [
    uniqueIndex('applications_project_profile_idx').on(t.projectId, t.profileId),
    index('applications_profile_idx').on(t.profileId, t.stage),
    index('applications_project_stage_idx').on(t.projectId, t.stage)
  ]
);

/** Gesprekken hangen altijd aan een aanmelding en dus aan een project. */
export const conversations = pgTable(
  'conversations',
  {
    id: id(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('conversations_application_idx').on(t.applicationId)]
);

export const messages = pgTable(
  'messages',
  {
    id: id(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    // Bijlagen als verwijzingen naar objectopslag, na malware-scan.
    attachments: jsonb('attachments').$type<Array<{ key: string; name: string; size: number; mime: string }>>().notNull().default([]),
    // Gestructureerde berichten: afspraak, locatie, beschikbaarheid — zodat info niet verdwijnt in de chat.
    kind: text('kind').notNull().default('text'), // 'text' | 'appointment' | 'system'
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamps.createdAt
  },
  (t) => [index('messages_conversation_idx').on(t.conversationId, t.createdAt)]
);

export const timesheets = pgTable(
  'timesheets',
  {
    id: id(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    isoYear: integer('iso_year').notNull(),
    isoWeek: integer('iso_week').notNull(),
    status: timesheetStatus('status').notNull().default('draft'),
    totalMinutes: integer('total_minutes').notNull().default(0),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNote: text('decision_note'),
    ...timestamps
  },
  (t) => [uniqueIndex('timesheets_week_idx').on(t.applicationId, t.isoYear, t.isoWeek)]
);

export const timesheetEntries = pgTable(
  'timesheet_entries',
  {
    id: id(),
    timesheetId: uuid('timesheet_id').notNull().references(() => timesheets.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    breakMinutes: integer('break_minutes').notNull().default(0),
    minutes: integer('minutes').notNull(),
    note: text('note').notNull().default(''),
    photoKeys: text('photo_keys').array().notNull().default([])
  },
  (t) => [uniqueIndex('timesheet_entries_day_idx').on(t.timesheetId, t.day)]
);
