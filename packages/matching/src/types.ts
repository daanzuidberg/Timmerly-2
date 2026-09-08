import type { AvailabilityStatus, CertificateType, ContractType, WorkArrangement } from '@timmerly/core';

/** Wat de matcher van een vakman moet weten. Bewust een plat object: de engine kent geen database. */
export interface ProfessionalFacts {
  id: string;
  trade: string;
  specialisms: readonly string[];
  yearsExperience: number;
  location: { lat: number; lng: number } | null;
  maxTravelKm: number;
  /** Alleen certificaten met status 'verified' tellen volledig mee. */
  certificates: ReadonlyArray<{ type: CertificateType; verified: boolean; expiresAt?: string | null }>;
  hasDriversLicense: boolean;
  hasOwnTransport: boolean;
  hasOwnTools: boolean;
  workArrangement: WorkArrangement;
  hourlyRateMin: number | null;
  availability: AvailabilityStatus;
  availableFrom: string | null; // ISO-datum
  hoursPerWeek: number;
  /** 0–100, intern. Reviews, opkomst, verificaties. */
  trustScore: number;
  reviewAverage: number | null; // 1–5
  completedProjects: number;
  /** Eerder gewerkt voor dit bedrijf (talentpool). */
  workedForCompanyIds?: readonly string[];
}

export interface ProjectFacts {
  id: string;
  companyId: string;
  trade: string;
  specialisms: readonly string[];
  location: { lat: number; lng: number } | null;
  startDate: string; // ISO-datum
  minYearsExperience: number;
  requiredCertificates: readonly CertificateType[];
  requiresOwnTransport: boolean;
  requiresOwnTools: boolean;
  contractType: ContractType;
  rateMin: number | null;
  rateMax: number | null;
  hoursPerWeek: number;
}

export interface MatchReason {
  key: string;
  label: string;
  positive: boolean;
  /** Bijdrage aan de score in punten (kan negatief zijn). Voor debugging en A/B. */
  points: number;
}

export interface MatchResult {
  score: number; // 0–100
  reasons: MatchReason[];
  /** Harde uitsluiting: verkeerd vak, buiten reisafstand, geen contractvorm-overlap. */
  eligible: boolean;
  distanceKm: number | null;
}

/**
 * Gewichten per criterium. Som = 100. Staan in de settings-tabel zodat ze
 * zonder release bijgesteld kunnen worden; dit zijn de standaardwaarden.
 */
export interface MatchWeights {
  specialism: number;
  experience: number;
  distance: number;
  certificates: number;
  availability: number;
  rate: number;
  logistics: number; // vervoer, gereedschap, rijbewijs
  reputation: number; // trust, reviews, afgeronde projecten
  hours: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  specialism: 20,
  experience: 14,
  distance: 16,
  certificates: 12,
  availability: 14,
  rate: 8,
  logistics: 6,
  reputation: 6,
  hours: 4
};
