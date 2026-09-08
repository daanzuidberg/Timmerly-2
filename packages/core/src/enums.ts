/**
 * Domeinwaarden die overal gelijk moeten zijn: database, API en UI importeren
 * ze van hier, zodat een nieuwe waarde op één plek wordt toegevoegd.
 */

export const USER_ROLES = ['professional', 'company', 'admin', 'moderator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Beroepen. Bewust een tabelwaarde en geen hardcoded UI-lijst: uitbreiden naar
 *  metselaars, tegelzetters etc. is een rij toevoegen, geen release. */
export const TRADES = [
  'timmerman',
  'allround_timmerman',
  'betontimmerman',
  'mutatietimmerman',
  'werkplaatstimmerman',
  'voorman_timmerman',
  'metselaar',
  'tegelzetter',
  'loodgieter',
  'elektricien',
  'schilder',
  'stukadoor',
  'sloper',
  'grondwerker',
  'uitvoerder',
  'werkvoorbereider'
] as const;
export type Trade = (typeof TRADES)[number];

export const TRADE_LABELS: Record<Trade, string> = {
  timmerman: 'Timmerman',
  allround_timmerman: 'Allround timmerman',
  betontimmerman: 'Betontimmerman',
  mutatietimmerman: 'Mutatietimmerman',
  werkplaatstimmerman: 'Werkplaatstimmerman',
  voorman_timmerman: 'Voorman timmerman',
  metselaar: 'Metselaar',
  tegelzetter: 'Tegelzetter',
  loodgieter: 'Loodgieter',
  elektricien: 'Elektricien',
  schilder: 'Schilder',
  stukadoor: 'Stukadoor',
  sloper: 'Sloper',
  grondwerker: 'Grondwerker',
  uitvoerder: 'Uitvoerder',
  werkvoorbereider: 'Werkvoorbereider'
};

/** Beroepen die in de MVP actief zijn. De rest staat klaar in het datamodel. */
export const ACTIVE_TRADES: readonly Trade[] = [
  'timmerman', 'allround_timmerman', 'betontimmerman', 'mutatietimmerman', 'werkplaatstimmerman', 'voorman_timmerman'
];

export const SPECIALISMS = [
  'ruwbouw', 'afbouw', 'aftimmering', 'renovatie', 'nieuwbouw', 'stelwerk', 'betontimmerwerk',
  'kozijnen_en_deuren', 'wanden_en_plafonds', 'mutatiewerk', 'onderhoud', 'daken', 'trappen', 'houtskeletbouw', 'utiliteitsbouw', 'woningbouw'
] as const;
export type Specialism = (typeof SPECIALISMS)[number];

export const SPECIALISM_LABELS: Record<Specialism, string> = {
  ruwbouw: 'Ruwbouw', afbouw: 'Afbouw', aftimmering: 'Aftimmering', renovatie: 'Renovatie', nieuwbouw: 'Nieuwbouw',
  stelwerk: 'Stelwerk', betontimmerwerk: 'Betontimmerwerk', kozijnen_en_deuren: 'Kozijnen en deuren',
  wanden_en_plafonds: 'Wanden en plafonds', mutatiewerk: 'Mutatiewerk', onderhoud: 'Onderhoud', daken: 'Daken',
  trappen: 'Trappen', houtskeletbouw: 'Houtskeletbouw', utiliteitsbouw: 'Utiliteitsbouw', woningbouw: 'Woningbouw'
};

export const CONTRACT_TYPES = ['zzp', 'employment', 'either'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = { zzp: 'ZZP', employment: 'Loondienst', either: 'ZZP of loondienst' };

/** Contractvorm van de vakman zelf (wat hij aanbiedt). */
export const WORK_ARRANGEMENTS = ['zzp', 'employment', 'either'] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const CERTIFICATE_TYPES = [
  'vca_basis', 'vca_vol', 'bhv', 'hoogwerker', 'heftruck', 'steigerbouw', 'veilig_hijsen', 'ehbo', 'asbest_herkenning', 'other'
] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];
export const CERTIFICATE_LABELS: Record<CertificateType, string> = {
  vca_basis: 'VCA Basis', vca_vol: 'VCA VOL', bhv: 'BHV', hoogwerker: 'Hoogwerker', heftruck: 'Heftruck',
  steigerbouw: 'Steigerbouw', veilig_hijsen: 'Veilig hijsen', ehbo: 'EHBO', asbest_herkenning: 'Asbestherkenning', other: 'Overig'
};

export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'rejected', 'expired'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: 'Niet geverifieerd', pending: 'In behandeling', verified: 'Geverifieerd', rejected: 'Afgekeurd', expired: 'Verlopen'
};

/** Wat er geverifieerd kan worden. Elke soort is een aparte claim met eigen bewijs. */
export const VERIFICATION_KINDS = ['email', 'phone', 'identity', 'company', 'certificate', 'zzp'] as const;
export type VerificationKind = (typeof VERIFICATION_KINDS)[number];

export const AVAILABILITY_STATUSES = ['available', 'limited', 'unavailable', 'booked'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Beschikbaar', limited: 'Beperkt beschikbaar', unavailable: 'Niet beschikbaar', booked: 'Geboekt'
};

export const PROJECT_STATUSES = ['draft', 'in_review', 'published', 'matching', 'filled', 'completed', 'cancelled', 'removed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Concept', in_review: 'In beoordeling', published: 'Gepubliceerd', matching: 'Matching', filled: 'Ingevuld',
  completed: 'Afgerond', cancelled: 'Geannuleerd', removed: 'Verwijderd'
};

/** De funnel match → interesse → contact → voorstel → akkoord → opdracht → afgerond → review. */
export const APPLICATION_STAGES = [
  'interest', 'contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed', 'declined', 'withdrawn'
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];
export const APPLICATION_STAGE_LABELS: Record<ApplicationStage, string> = {
  interest: 'Interesse', contact: 'In gesprek', proposal: 'Voorstel', agreed: 'Akkoord', active: 'Opdracht loopt',
  completed: 'Afgerond', reviewed: 'Beoordeeld', declined: 'Niet geselecteerd', withdrawn: 'Ingetrokken'
};

export const TIMESHEET_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export const REVIEW_DIRECTIONS = ['company_to_professional', 'professional_to_company'] as const;
export type ReviewDirection = (typeof REVIEW_DIRECTIONS)[number];

/** Beoordelingscategorieën per richting (zie spec §14). */
export const REVIEW_CATEGORIES: Record<ReviewDirection, readonly string[]> = {
  company_to_professional: ['vakmanschap', 'betrouwbaarheid', 'op_tijd', 'communicatie', 'kwaliteit', 'zelfstandigheid', 'veilig_werken'],
  professional_to_company: ['communicatie', 'betaling', 'werkorganisatie', 'werksfeer', 'duidelijkheid', 'materiaal', 'planning']
};
export const REVIEW_CATEGORY_LABELS: Record<string, string> = {
  vakmanschap: 'Vakmanschap', betrouwbaarheid: 'Betrouwbaarheid', op_tijd: 'Op tijd komen', communicatie: 'Communicatie',
  kwaliteit: 'Kwaliteit', zelfstandigheid: 'Zelfstandigheid', veilig_werken: 'Veilig werken', betaling: 'Betaling',
  werkorganisatie: 'Werkorganisatie', werksfeer: 'Werksfeer', duidelijkheid: 'Duidelijkheid', materiaal: 'Materiaal', planning: 'Planning'
};

export const REPORT_REASONS = ['fraud', 'fake_account', 'harassment', 'unsafe_work', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const NOTIFICATION_TYPES = [
  'match_found', 'interest_received', 'application_stage', 'message', 'certificate_expiring', 'verification_result',
  'timesheet', 'review_request', 'project_status', 'security'
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const PROVINCES = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'Noord-Brabant', 'Noord-Holland',
  'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland'
] as const;
export type Province = (typeof PROVINCES)[number];

export const EXPERIENCE_BANDS = ['0-2', '3-5', '6-10', '10+'] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];
