import { z } from 'zod';
import {
  CERTIFICATE_TYPES, CONTRACT_TYPES, EXPERIENCE_BANDS, PROVINCES, REPORT_REASONS, SPECIALISMS, TRADES, WORK_ARRANGEMENTS
} from './enums';

/** Nederlandse invoerregels op één plek; server en client gebruiken dezelfde schema's. */

export const emailSchema = z.string().trim().toLowerCase().email('Vul een geldig e-mailadres in').max(254);

export const passwordSchema = z
  .string()
  .min(12, 'Gebruik minimaal 12 tekens')
  .max(200)
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), 'Combineer letters en cijfers');

/**
 * Nederlands mobiel, vast of servicenummer, ruim genomen. Mensen typen
 * scheidingstekens op allerlei manieren (spatie, streepje, haakjes) — die
 * tellen niet mee voor de geldigheid, alleen de cijfers en het
 * land-/kengetal doen dat. 06, 088 en gewone kengetallen (020, 038, ...)
 * hebben altijd 10 cijfers; 0800/0900-servicenummers hebben een
 * abonneenummer van wisselende lengte (4 t/m 7 cijfers, dus 8 t/m 11
 * cijfers totaal).
 */
const NL_PHONE = /^(?:\+31|0)[1-9]\d{8}$|^0(?:800|90[0-9])\d{4,7}$/;
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => NL_PHONE.test(v.replace(/[\s\-().]/g, '')), 'Vul een geldig Nederlands telefoonnummer in');

/** Selects sturen '' voor "geen keuze"; dat is hetzelfde als niet ingevuld. */
const provinceField = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.enum(PROVINCES).optional());

export const kvkSchema = z.string().trim().regex(/^\d{8}$/, 'Een KvK-nummer heeft 8 cijfers');

/** BTW-id NL: NL + 9 cijfers + B + 2 cijfers. Alleen formaat; geldigheid via VIES. */
export const btwSchema = z.string().trim().toUpperCase().regex(/^NL\d{9}B\d{2}$/, 'Vul een geldig BTW-nummer in (NL123456789B01)');

export const registerSchema = z.object({
  role: z.enum(['professional', 'company']),
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'Vul je voornaam in').max(80),
  lastName: z.string().trim().min(1, 'Vul je achternaam in').max(80),
  acceptTerms: z.literal(true, { error: 'Je moet de voorwaarden accepteren' })
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vul je wachtwoord in'),
  totp: z.string().trim().regex(/^\d{6}$/).optional().or(z.literal(''))
});

export const professionalProfileSchema = z.object({
  trade: z.enum(TRADES),
  specialisms: z.array(z.enum(SPECIALISMS)).min(1, 'Kies minimaal één specialisatie').max(8),
  experienceBand: z.enum(EXPERIENCE_BANDS),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  bio: z.string().trim().max(1500).optional().default(''),
  city: z.string().trim().min(2, 'Vul je woonplaats in').max(80),
  province: provinceField,
  maxTravelKm: z.coerce.number().int().min(5).max(300),
  hasDriversLicense: z.coerce.boolean(),
  hasOwnTransport: z.coerce.boolean(),
  hasOwnTools: z.coerce.boolean(),
  workArrangement: z.enum(WORK_ARRANGEMENTS),
  hourlyRateMin: z.coerce.number().int().min(0).max(500).optional().nullable(),
  hoursPerWeek: z.coerce.number().int().min(4).max(60).default(40),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  phone: phoneSchema.optional().or(z.literal(''))
});
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;

export const zzpDetailsSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  kvkNumber: kvkSchema,
  btwNumber: btwSchema.optional().or(z.literal('')),
  seat: z.string().trim().min(2).max(80),
  hasLiabilityInsurance: z.coerce.boolean()
});

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, 'Vul de bedrijfsnaam in').max(120),
  kvkNumber: kvkSchema,
  website: z.string().trim().url('Vul een geldige URL in').max(200).optional().or(z.literal('')),
  phone: phoneSchema,
  city: z.string().trim().min(2).max(80),
  province: provinceField,
  companyType: z.string().trim().max(80).optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  specialisms: z.array(z.enum(SPECIALISMS)).max(10).default([]),
  employeeCount: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  workAreaKm: z.coerce.number().int().min(10).max(500).default(100)
});
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export const certificateSchema = z.object({
  type: z.enum(CERTIFICATE_TYPES),
  label: z.string().trim().max(80).optional().default(''),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  documentNumber: z.string().trim().max(80).optional().default('')
});

export const projectSchema = z.object({
  title: z.string().trim().min(5, 'Geef het project een duidelijke naam').max(120),
  description: z.string().trim().min(20, 'Beschrijf het werk in minimaal een paar zinnen').max(5000),
  trade: z.enum(TRADES),
  specialisms: z.array(z.enum(SPECIALISMS)).min(1, 'Kies minimaal één soort werk').max(8),
  city: z.string().trim().min(2, 'Vul de plaats in').max(80),
  province: provinceField,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vul een startdatum in'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  headcount: z.coerce.number().int().min(1).max(200),
  hoursPerWeek: z.coerce.number().int().min(4).max(60),
  workingHours: z.string().trim().max(60).optional().default('07:00 – 16:00'),
  minYearsExperience: z.coerce.number().int().min(0).max(40).default(0),
  requiredCertificates: z.array(z.enum(CERTIFICATE_TYPES)).max(6).default([]),
  requiresOwnTransport: z.coerce.boolean().default(false),
  requiresOwnTools: z.coerce.boolean().default(false),
  contractType: z.enum(CONTRACT_TYPES),
  rateMin: z.coerce.number().int().min(0).max(500).optional().nullable(),
  rateMax: z.coerce.number().int().min(0).max(500).optional().nullable(),
  housingAvailable: z.coerce.boolean().default(false),
  travelAllowance: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(2000).optional().default('')
}).refine((p) => !p.rateMin || !p.rateMax || p.rateMin <= p.rateMax, { message: 'Minimumtarief is hoger dan maximum', path: ['rateMax'] })
  .refine((p) => !p.endDate || p.endDate >= p.startDate, { message: 'Einddatum ligt voor de startdatum', path: ['endDate'] });
export type ProjectInput = z.infer<typeof projectSchema>;

export const projectSearchSchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  trade: z.enum(TRADES).optional(),
  specialism: z.enum(SPECIALISMS).optional(),
  province: z.enum(PROVINCES).optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  maxKm: z.coerce.number().int().min(5).max(300).optional(),
  startWithinDays: z.coerce.number().int().min(0).max(365).optional(),
  minRate: z.coerce.number().int().min(0).max(500).optional(),
  sort: z.enum(['match', 'newest', 'start']).default('match')
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Typ een bericht').max(4000)
});

export const reviewSchema = z.object({
  scores: z.record(z.string(), z.coerce.number().int().min(1).max(5)),
  comment: z.string().trim().max(2000).optional().default('')
});

export const timesheetEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakMinutes: z.coerce.number().int().min(0).max(240).default(30),
  note: z.string().trim().max(500).optional().default('')
});

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10, 'Beschrijf wat er aan de hand is').max(2000)
});

export const notificationPrefsSchema = z.object({
  email: z.coerce.boolean(),
  push: z.coerce.boolean(),
  matchDigest: z.enum(['instant', 'daily', 'weekly', 'off'])
});
