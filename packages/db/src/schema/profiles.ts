import { boolean, date, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_shared';
import { availabilityStatus, certificateType, experienceBand, verificationKind, verificationStatus, workArrangement } from './enums';
import { users } from './auth';

/** Beroepen als data, niet als code: nieuwe vakgebieden zijn een rij. */
export const trades = pgTable('trades', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0)
});

export const professionalProfiles = pgTable(
  'professional_profiles',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    trade: text('trade').notNull().references(() => trades.slug),
    specialisms: text('specialisms').array().notNull().default([]),
    experienceBand: experienceBand('experience_band').notNull().default('0-2'),
    yearsExperience: integer('years_experience').notNull().default(0),
    bio: text('bio').notNull().default(''),
    city: text('city').notNull().default(''),
    province: text('province'),
    // Exacte coördinaten alleen voor afstandsberekening; UI gebruikt de vergrofde kopie.
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    maxTravelKm: integer('max_travel_km').notNull().default(50),
    hasDriversLicense: boolean('has_drivers_license').notNull().default(false),
    hasOwnTransport: boolean('has_own_transport').notNull().default(false),
    hasOwnTools: boolean('has_own_tools').notNull().default(false),
    workArrangement: workArrangement('work_arrangement').notNull().default('either'),
    hourlyRateMin: integer('hourly_rate_min'),
    hoursPerWeek: integer('hours_per_week').notNull().default(40),
    availableFrom: date('available_from'),
    // Actuele beschikbaarheid als samenvatting; de kalender is de bron.
    availability: availabilityStatus('availability').notNull().default('available'),
    zzp: jsonb('zzp').$type<{
      companyName: string; kvkNumber: string; btwNumber?: string; seat: string; hasLiabilityInsurance: boolean;
    } | null>(),
    // Wat de gebruiker publiek wil tonen (AVG: eigen regie over zichtbaarheid).
    visibility: jsonb('visibility').$type<{ showCity: boolean; showRate: boolean; searchable: boolean }>().notNull()
      .default({ showCity: true, showRate: false, searchable: true }),
    profileCompleteness: integer('profile_completeness').notNull().default(0),
    // Interne trustscore 0–100; alleen een grove versie is zichtbaar voor anderen.
    trustScore: integer('trust_score').notNull().default(50),
    onboardingStep: integer('onboarding_step').notNull().default(1),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    uniqueIndex('pro_profiles_user_idx').on(t.userId),
    index('pro_profiles_trade_idx').on(t.trade),
    index('pro_profiles_geo_idx').on(t.lat, t.lng),
    index('pro_profiles_avail_idx').on(t.availability, t.availableFrom)
  ]
);

export const companyProfiles = pgTable(
  'company_profiles',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kvkNumber: text('kvk_number').notNull(),
    website: text('website'),
    phone: text('phone'),
    city: text('city').notNull().default(''),
    province: text('province'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    companyType: text('company_type').notNull().default(''),
    description: text('description').notNull().default(''),
    specialisms: text('specialisms').array().notNull().default([]),
    employeeCount: integer('employee_count'),
    workAreaKm: integer('work_area_km').notNull().default(100),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    trustScore: integer('trust_score').notNull().default(50),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [uniqueIndex('company_profiles_user_idx').on(t.userId), index('company_profiles_kvk_idx').on(t.kvkNumber)]
);

export const certificates = pgTable(
  'certificates',
  {
    id: id(),
    profileId: uuid('profile_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
    type: certificateType('type').notNull(),
    label: text('label').notNull().default(''),
    documentNumber: text('document_number').notNull().default(''),
    issuedAt: date('issued_at'),
    expiresAt: date('expires_at'),
    status: verificationStatus('status').notNull().default('unverified'),
    // Verwijzing naar het document in objectopslag; nooit het bestand zelf in de DB.
    documentKey: text('document_key'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    // Waarschuwing "verloopt over 30 dagen" maar één keer versturen.
    expiryWarnedAt: timestamp('expiry_warned_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [index('certificates_profile_idx').on(t.profileId), index('certificates_expiry_idx').on(t.expiresAt, t.status)]
);

/**
 * Elke verificatieclaim is een rij: e-mail, telefoon, identiteit, bedrijf, ZZP.
 * Bewijs komt van een provider (identity) of een beoordelaar (admin); wij
 * bewaren alleen de uitkomst en een referentie, geen kopieën van documenten.
 */
export const verifications = pgTable(
  'verifications',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: verificationKind('kind').notNull(),
    status: verificationStatus('status').notNull().default('pending'),
    provider: text('provider'), // 'internal' | 'kvk' | 'idin' | 'manual'
    providerRef: text('provider_ref'),
    evidence: jsonb('evidence').$type<Record<string, unknown>>().notNull().default({}),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    note: text('note'),
    ...timestamps
  },
  (t) => [index('verifications_user_kind_idx').on(t.userId, t.kind), index('verifications_status_idx').on(t.status)]
);

/** Beschikbaarheidskalender: één rij per afwijkende dag; ontbrekend = profielstandaard. */
export const availabilityDays = pgTable(
  'availability_days',
  {
    profileId: uuid('profile_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    status: availabilityStatus('status').notNull()
  },
  (t) => [uniqueIndex('availability_days_pk').on(t.profileId, t.day)]
);

/** Portfolio: eerdere projecten, ook buiten Timmerly om. */
export const workHistory = pgTable(
  'work_history',
  {
    id: id(),
    profileId: uuid('profile_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    role: text('role').notNull().default(''),
    client: text('client').notNull().default(''),
    city: text('city').notNull().default(''),
    startDate: date('start_date'),
    endDate: date('end_date'),
    description: text('description').notNull().default(''),
    // Als het project via Timmerly liep is het geverifieerd.
    projectId: uuid('project_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamps.createdAt
  },
  (t) => [index('work_history_profile_idx').on(t.profileId)]
);
