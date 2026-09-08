import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_shared';
import { users } from './auth';

/**
 * Auditlog: wie deed wat met welk object. Append-only; nooit bijwerken of
 * verwijderen. Voor admin-acties verplicht, voor gebruikersacties waar het
 * juridisch of voor fraudeonderzoek relevant is.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorRole: text('actor_role'),
    action: text('action').notNull(), // 'certificate.verified', 'user.suspended', 'project.published', ...
    objectType: text('object_type').notNull(),
    objectId: text('object_id').notNull(),
    before: jsonb('before').$type<Record<string, unknown> | null>(),
    after: jsonb('after').$type<Record<string, unknown> | null>(),
    ip: text('ip'),
    createdAt: timestamps.createdAt
  },
  (t) => [index('audit_object_idx').on(t.objectType, t.objectId), index('audit_actor_idx').on(t.actorId, t.createdAt)]
);

/**
 * Uitkomst van een ZZP-compliancecheck (Wet DBA). We bewaren de antwoorden, de
 * versie van de regelset en de uitkomst, zodat een latere wetswijziging niet
 * met terugwerkende kracht oude uitkomsten verandert.
 */
export const complianceChecks = pgTable(
  'compliance_checks',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id'),
    rulesetVersion: text('ruleset_version').notNull(),
    answers: jsonb('answers').$type<Record<string, string>>().notNull(),
    riskLevel: text('risk_level').notNull(), // 'low' | 'attention' | 'high'
    score: integer('score').notNull(),
    signals: jsonb('signals').$type<Array<{ factor: string; level: string; text: string }>>().notNull(),
    createdAt: timestamps.createdAt
  },
  (t) => [index('compliance_user_idx').on(t.userId, t.createdAt)]
);

/** Achtergrondtaken: e-mails, matchmeldingen, certificaatwaarschuwingen. Eenvoudige DB-queue; Redis/BullMQ later zonder domeinwijziging. */
export const jobs = pgTable(
  'jobs',
  {
    id: id(),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamps.createdAt
  },
  (t) => [index('jobs_due_idx').on(t.completedAt, t.runAt)]
);

/** Verdienmodel: abonnementen als data, prijzen niet in code. */
export const plans = pgTable('plans', {
  slug: text('slug').primaryKey(), // 'free' | 'pro_premium' | 'company_starter' | 'company_professional' | 'company_enterprise'
  audience: text('audience').notNull(), // 'professional' | 'company'
  label: text('label').notNull(),
  priceCentsMonthly: integer('price_cents_monthly').notNull().default(0),
  features: jsonb('features').$type<Record<string, boolean | number>>().notNull().default({}),
  active: integer('active').notNull().default(1)
});

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    planSlug: text('plan_slug').notNull().references(() => plans.slug),
    status: text('status').notNull().default('active'), // 'active' | 'cancelled' | 'past_due'
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    externalRef: text('external_ref'), // Mollie/Stripe-id
    ...timestamps
  },
  (t) => [index('subscriptions_user_idx').on(t.userId)]
);

/** Centrale configuratie: DBA-regelset, matchinggewichten, feature flags. Wijzigbaar zonder release. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamps.updatedAt
});
