import { CERTIFICATE_LABELS, SPECIALISM_LABELS, daysBetween, distanceKm } from '@timmerly/core';
import { DEFAULT_WEIGHTS, type MatchReason, type MatchResult, type MatchWeights, type ProfessionalFacts, type ProjectFacts } from './types';

/**
 * Matching in twee lagen:
 *  1. Harde criteria (poortwachters): verkeerd vak, buiten reisafstand of geen
 *     overlap in contractvorm → niet geschikt, score 0, met reden.
 *  2. Zachte criteria: elk criterium levert 0..1 op, vermenigvuldigd met zijn
 *     gewicht. Elke bijdrage krijgt een leesbare reden zodat "96% match" altijd
 *     uitlegbaar is — voor de gebruiker én voor evaluatie van het algoritme.
 *
 * De engine is symmetrisch: dezelfde functie beantwoordt "welke vakmensen
 * passen bij dit project" en "welke projecten passen bij deze vakman".
 */
export function scoreMatch(
  pro: ProfessionalFacts,
  project: ProjectFacts,
  options: { weights?: Partial<MatchWeights>; today?: string } = {}
): MatchResult {
  const w: MatchWeights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const reasons: MatchReason[] = [];
  const distance = pro.location && project.location ? Math.round(distanceKm(pro.location, project.location)) : null;

  // ── Poortwachters ────────────────────────────────────────────────────────
  const hard: string[] = [];
  if (pro.trade !== project.trade && !relatedTrade(pro.trade, project.trade)) hard.push('Ander vakgebied');
  if (distance !== null && distance > pro.maxTravelKm) hard.push(`${distance} km, buiten je reisafstand van ${pro.maxTravelKm} km`);
  if (!contractOverlap(pro.workArrangement, project.contractType)) hard.push('Contractvorm past niet');
  if (pro.availability === 'unavailable') hard.push('Niet beschikbaar');
  if (hard.length) {
    return {
      score: 0,
      eligible: false,
      distanceKm: distance,
      reasons: hard.map((label) => ({ key: 'hard', label, positive: false, points: 0 }))
    };
  }

  let total = 0;
  const add = (key: string, weight: number, ratio: number, label: string, positive = ratio >= 0.5) => {
    const points = Math.round(weight * clamp(ratio) * 10) / 10;
    total += points;
    reasons.push({ key, label, positive, points });
  };

  // ── Specialisatie ────────────────────────────────────────────────────────
  const overlap = project.specialisms.filter((s) => pro.specialisms.includes(s));
  if (project.specialisms.length === 0) add('specialism', w.specialism, 0.8, 'Geen specifieke specialisatie gevraagd');
  else if (overlap.length === project.specialisms.length) add('specialism', w.specialism, 1, `Alle gevraagde werkzaamheden in profiel: ${labels(overlap)}`);
  else if (overlap.length > 0) add('specialism', w.specialism, 0.45 + 0.4 * (overlap.length / project.specialisms.length), `Ervaring met ${labels(overlap)}`);
  else add('specialism', w.specialism, 0.15, `Nog geen ervaring met ${labels(project.specialisms)}`, false);

  // ── Ervaring ─────────────────────────────────────────────────────────────
  if (project.minYearsExperience === 0) add('experience', w.experience, pro.yearsExperience >= 3 ? 1 : 0.7, `${pro.yearsExperience} jaar ervaring`);
  else if (pro.yearsExperience >= project.minYearsExperience) add('experience', w.experience, Math.min(1, 0.8 + (pro.yearsExperience - project.minYearsExperience) * 0.04), `${pro.yearsExperience} jaar ervaring (minimaal ${project.minYearsExperience} gevraagd)`);
  else add('experience', w.experience, 0.3 * (pro.yearsExperience / project.minYearsExperience), `${pro.yearsExperience} jaar ervaring, ${project.minYearsExperience} jaar gevraagd`, false);

  // ── Afstand ──────────────────────────────────────────────────────────────
  if (distance === null) add('distance', w.distance, 0.5, 'Afstand onbekend', false);
  else {
    const ratio = distance <= 15 ? 1 : distance <= 30 ? 0.9 : distance <= 50 ? 0.7 : distance <= 80 ? 0.45 : 0.25;
    add('distance', w.distance, ratio, `${distance} km van het project`, distance <= 50);
  }

  // ── Certificaten ─────────────────────────────────────────────────────────
  if (project.requiredCertificates.length === 0) add('certificates', w.certificates, 0.85, 'Geen certificaten vereist');
  else {
    const have = project.requiredCertificates.map((req) => {
      const c = pro.certificates.find((pc) => satisfies(pc.type, req) && !expired(pc.expiresAt, today));
      return { req, c };
    });
    const verified = have.filter((h) => h.c?.verified).length;
    const claimed = have.filter((h) => h.c && !h.c.verified).length;
    const missing = have.filter((h) => !h.c).map((h) => CERTIFICATE_LABELS[h.req]);
    const ratio = (verified + claimed * 0.6) / project.requiredCertificates.length;
    const label = missing.length === 0
      ? claimed === 0 ? `${labelsCert(project.requiredCertificates)} geverifieerd` : `${labelsCert(project.requiredCertificates)} opgegeven, verificatie loopt`
      : `Ontbreekt: ${missing.join(', ')}`;
    add('certificates', w.certificates, ratio, label, missing.length === 0);
  }

  // ── Beschikbaarheid ──────────────────────────────────────────────────────
  const from = pro.availableFrom ?? today;
  const gap = daysBetween(project.startDate, from); // >0 = later beschikbaar dan start
  if (pro.availability === 'limited') add('availability', w.availability, 0.5, 'Beperkt beschikbaar', false);
  else if (gap <= 0) add('availability', w.availability, 1, `Beschikbaar vanaf ${fmt(from)}`);
  else if (gap <= 14) add('availability', w.availability, 0.7, `Beschikbaar vanaf ${fmt(from)}, ${gap} dagen na de start`, false);
  else add('availability', w.availability, 0.2, `Pas beschikbaar vanaf ${fmt(from)}`, false);

  // ── Tarief ───────────────────────────────────────────────────────────────
  if (pro.hourlyRateMin === null || project.rateMax === null) add('rate', w.rate, 0.7, 'Tarief in overleg');
  else if (pro.hourlyRateMin <= project.rateMax) add('rate', w.rate, 1, `Tarief past binnen ${euro(project.rateMin)} – ${euro(project.rateMax)}`);
  else if (pro.hourlyRateMin <= project.rateMax * 1.1) add('rate', w.rate, 0.5, `Tarief iets boven indicatie (${euro(pro.hourlyRateMin)})`, false);
  else add('rate', w.rate, 0.1, `Tarief boven indicatie (${euro(pro.hourlyRateMin)} vs ${euro(project.rateMax)})`, false);

  // ── Logistiek ────────────────────────────────────────────────────────────
  const logistics: string[] = [];
  let logisticRatio = 1;
  if (project.requiresOwnTransport) { if (pro.hasOwnTransport) logistics.push('eigen vervoer'); else { logisticRatio -= 0.5; logistics.push('geen eigen vervoer'); } }
  if (project.requiresOwnTools) { if (pro.hasOwnTools) logistics.push('eigen gereedschap'); else { logisticRatio -= 0.4; logistics.push('geen eigen gereedschap'); } }
  if (!project.requiresOwnTransport && pro.hasOwnTransport) logistics.push('eigen vervoer');
  if (!pro.hasDriversLicense && project.requiresOwnTransport) logisticRatio -= 0.1;
  add('logistics', w.logistics, Math.max(0, logisticRatio), logistics.length ? capitalize(logistics.join(', ')) : 'Geen logistieke eisen', logisticRatio >= 0.6);

  // ── Reputatie ────────────────────────────────────────────────────────────
  const rep = 0.5 * (pro.trustScore / 100) + 0.3 * (pro.reviewAverage ? (pro.reviewAverage - 1) / 4 : 0.6) + 0.2 * Math.min(1, pro.completedProjects / 10);
  const repLabel = pro.reviewAverage ? `Beoordeling ${pro.reviewAverage.toFixed(1)} na ${pro.completedProjects} projecten` : pro.completedProjects ? `${pro.completedProjects} projecten via Timmerly` : 'Nog geen projecten via Timmerly';
  add('reputation', w.reputation, rep, repLabel, rep >= 0.5);
  if (pro.workedForCompanyIds?.includes(project.companyId)) { total += 3; reasons.push({ key: 'talentpool', label: 'Eerder ingezet door dit bedrijf', positive: true, points: 3 }); }

  // ── Uren ─────────────────────────────────────────────────────────────────
  const hoursRatio = pro.hoursPerWeek >= project.hoursPerWeek ? 1 : pro.hoursPerWeek / project.hoursPerWeek;
  add('hours', w.hours, hoursRatio, hoursRatio >= 1 ? `${project.hoursPerWeek} uur per week mogelijk` : `Wil ${pro.hoursPerWeek} uur, project vraagt ${project.hoursPerWeek}`, hoursRatio >= 0.8);

  const score = Math.max(0, Math.min(100, Math.round(total)));
  // Positieve redenen eerst, dan op gewicht: de UI toont de top 6.
  reasons.sort((a, b) => Number(b.positive) - Number(a.positive) || b.points - a.points);
  return { score, eligible: true, distanceKm: distance, reasons };
}

/** Rangschikt kandidaten voor een project; ongeschikte kandidaten vallen af. */
export function rankProfessionals(project: ProjectFacts, pros: readonly ProfessionalFacts[], options?: { weights?: Partial<MatchWeights>; today?: string }) {
  return pros
    .map((pro) => ({ pro, match: scoreMatch(pro, project, options) }))
    .filter((r) => r.match.eligible)
    .sort((a, b) => b.match.score - a.match.score);
}

/** Rangschikt projecten voor een vakman. */
export function rankProjects(pro: ProfessionalFacts, projects: readonly ProjectFacts[], options?: { weights?: Partial<MatchWeights>; today?: string }) {
  return projects
    .map((project) => ({ project, match: scoreMatch(pro, project, options) }))
    .filter((r) => r.match.eligible)
    .sort((a, b) => b.match.score - a.match.score);
}

// ── Hulpfuncties ───────────────────────────────────────────────────────────
function contractOverlap(pro: string, project: string): boolean {
  return pro === 'either' || project === 'either' || pro === project;
}

/** Een allround timmerman kan timmermanswerk doen en andersom; specialistische varianten niet automatisch. */
const TRADE_FAMILY: Record<string, readonly string[]> = {
  timmerman: ['allround_timmerman', 'voorman_timmerman'],
  allround_timmerman: ['timmerman', 'voorman_timmerman'],
  voorman_timmerman: ['timmerman', 'allround_timmerman']
};
function relatedTrade(a: string, b: string): boolean {
  return TRADE_FAMILY[b]?.includes(a) ?? false;
}

/** VCA VOL dekt VCA Basis. */
function satisfies(have: string, need: string): boolean {
  return have === need || (need === 'vca_basis' && have === 'vca_vol');
}

function expired(expiresAt: string | null | undefined, today: string): boolean {
  return !!expiresAt && expiresAt < today;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function labels(keys: readonly string[]): string {
  return keys.map((k) => (SPECIALISM_LABELS as Record<string, string>)[k] ?? k).join(', ').toLowerCase();
}
function labelsCert(keys: readonly string[]): string {
  return keys.map((k) => (CERTIFICATE_LABELS as Record<string, string>)[k] ?? k).join(', ');
}
function euro(n: number | null): string {
  return n === null ? '—' : `€${n}`;
}
function fmt(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}-${Number(m)}-${y}`;
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
