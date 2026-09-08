import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_shared';
import { notificationType, reportReason, reviewDirection } from './enums';
import { users } from './auth';
import { applications, projects } from './projects';

/** Reviews: alleen na een afgeronde opdracht, één per richting per aanmelding. */
export const reviews = pgTable(
  'reviews',
  {
    id: id(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    direction: reviewDirection('direction').notNull(),
    authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    scores: jsonb('scores').$type<Record<string, number>>().notNull(),
    overall: integer('overall').notNull(), // gemiddelde ×10, bijv. 47 = 4,7
    comment: text('comment').notNull().default(''),
    // Moderatie: verborgen reviews tellen niet mee.
    hiddenAt: timestamp('hidden_at', { withTimezone: true }),
    hiddenReason: text('hidden_reason'),
    ...timestamps
  },
  (t) => [uniqueIndex('reviews_once_idx').on(t.applicationId, t.direction), index('reviews_subject_idx').on(t.subjectId)]
);

/** Favorieten en talentpool: bedrijf → vakman, en vakman → bedrijf. */
export const favorites = pgTable(
  'favorites',
  {
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Talentpool-label, bijv. 'eerder ingezet'.
    tag: text('tag'),
    note: text('note'),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('favorites_pk').on(t.ownerId, t.targetId)]
);

export const savedProjects = pgTable(
  'saved_projects',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('saved_projects_pk').on(t.userId, t.projectId)]
);

export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: notificationType('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    href: text('href'),
    readAt: timestamp('read_at', { withTimezone: true }),
    emailedAt: timestamp('emailed_at', { withTimezone: true }),
    createdAt: timestamps.createdAt
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.readAt, t.createdAt)]
);

export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  email: boolean('email').notNull().default(true),
  push: boolean('push').notNull().default(false),
  matchDigest: text('match_digest').notNull().default('daily'), // 'instant' | 'daily' | 'weekly' | 'off'
  updatedAt: timestamps.updatedAt
});

/** Meldingen van gebruikers: fraude, nepaccount, onveilig werk, ongewenst gedrag. */
export const reports = pgTable(
  'reports',
  {
    id: id(),
    reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
    targetProjectId: uuid('target_project_id').references(() => projects.id, { onDelete: 'cascade' }),
    reason: reportReason('reason').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'in_review' | 'resolved' | 'dismissed'
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamps.createdAt
  },
  (t) => [index('reports_status_idx').on(t.status, t.createdAt)]
);

export const blocks = pgTable(
  'blocks',
  {
    blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('blocks_pk').on(t.blockerId, t.blockedId)]
);
