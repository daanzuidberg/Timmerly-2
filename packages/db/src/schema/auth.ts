import { boolean, index, inet, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_shared';
import { accountStatus, userRole } from './enums';

/**
 * Een account is bewust los van profielen: één user heeft óf een vakmanprofiel
 * óf een bedrijfsprofiel (of is admin). Rollen zitten op het account (RBAC).
 */
export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull(),
    status: accountStatus('status').notNull().default('active'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    // TOTP-geheim wordt versleuteld opgeslagen (zie apps/web/src/lib/auth/totp).
    totpSecretEnc: text('totp_secret_enc'),
    totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }).notNull(),
    // Interne risicoscore voor fraudepreventie (0–100). Nooit aan gebruikers getoond.
    riskScore: integer('risk_score').notNull().default(0),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email), index('users_role_idx').on(t.role)]
);

/** Serverzijdige sessies: intrekbaar, per apparaat zichtbaar, met verloopdatum. */
export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ip: inet('ip'),
    // Sessie is pas volwaardig na 2FA als dat aanstaat.
    mfaPassed: boolean('mfa_passed').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('sessions_token_idx').on(t.tokenHash), index('sessions_user_idx').on(t.userId)]
);

/** Eenmalige tokens: e-mailverificatie, wachtwoord-reset, telefoonverificatie. */
export const oneTimeTokens = pgTable(
  'one_time_tokens',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull(), // 'verify_email' | 'reset_password' | 'verify_phone'
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamps.createdAt
  },
  (t) => [uniqueIndex('ott_hash_idx').on(t.tokenHash), index('ott_user_purpose_idx').on(t.userId, t.purpose)]
);

/** Alles wat een account raakt: inloggen, wachtwoord, 2FA, sessies. Voor loginmeldingen en onderzoek. */
export const securityEvents = pgTable(
  'security_events',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').notNull(), // 'login_ok' | 'login_failed' | 'password_changed' | 'mfa_enabled' | ...
    ip: inet('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamps.createdAt
  },
  (t) => [index('security_events_user_idx').on(t.userId, t.createdAt)]
);
