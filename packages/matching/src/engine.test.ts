import { describe, expect, it } from 'vitest';
import { rankProfessionals, rankProjects, scoreMatch } from './engine';
import type { ProfessionalFacts, ProjectFacts } from './types';

const TODAY = '2026-09-08';
const KAMPEN = { lat: 52.555, lng: 5.9114 };
const ALMERE = { lat: 52.3508, lng: 5.2647 };
const UTRECHT = { lat: 52.0907, lng: 5.1214 };

const daan: ProfessionalFacts = {
  id: 'daan', trade: 'allround_timmerman', specialisms: ['aftimmering', 'kozijnen_en_deuren', 'woningbouw'], yearsExperience: 8,
  location: KAMPEN, maxTravelKm: 60, certificates: [{ type: 'vca_basis', verified: true, expiresAt: '2027-10-07' }, { type: 'bhv', verified: true }],
  hasDriversLicense: true, hasOwnTransport: true, hasOwnTools: true, workArrangement: 'zzp', hourlyRateMin: 47,
  availability: 'available', availableFrom: '2026-09-14', hoursPerWeek: 40, trustScore: 88, reviewAverage: 4.9, completedProjects: 17
};

const almerePoort: ProjectFacts = {
  id: 'p1', companyId: 'vandijk', trade: 'timmerman', specialisms: ['aftimmering', 'kozijnen_en_deuren'], location: ALMERE,
  startDate: '2026-09-21', minYearsExperience: 3, requiredCertificates: ['vca_basis'], requiresOwnTransport: true, requiresOwnTools: false,
  contractType: 'either', rateMin: 45, rateMax: 50, hoursPerWeek: 40
};

describe('scoreMatch', () => {
  it('geeft een sterke kandidaat een hoge, uitgelegde score', () => {
    const r = scoreMatch(daan, almerePoort, { today: TODAY });
    expect(r.eligible).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(90);
    const labels = r.reasons.map((x) => x.label);
    expect(labels.some((l) => l.includes('8 jaar ervaring'))).toBe(true);
    expect(labels.some((l) => l.includes('km van het project'))).toBe(true);
    expect(labels.some((l) => l.includes('VCA Basis geverifieerd'))).toBe(true);
    expect(labels.some((l) => l.includes('Beschikbaar vanaf 14-9-2026'))).toBe(true);
    expect(r.reasons[0]!.positive).toBe(true);
  });

  it('sluit uit op vak, reisafstand en contractvorm', () => {
    expect(scoreMatch({ ...daan, trade: 'metselaar' }, almerePoort, { today: TODAY }).eligible).toBe(false);
    const far = scoreMatch({ ...daan, maxTravelKm: 30 }, almerePoort, { today: TODAY });
    expect(far.eligible).toBe(false);
    expect(far.reasons[0]!.label).toMatch(/buiten je reisafstand/);
    expect(scoreMatch({ ...daan, workArrangement: 'employment' }, { ...almerePoort, contractType: 'zzp' }, { today: TODAY }).eligible).toBe(false);
  });

  it('laat een allround timmerman meedoen op een timmermansproject, maar geen betontimmerman op een sloperproject', () => {
    expect(scoreMatch({ ...daan, trade: 'allround_timmerman' }, { ...almerePoort, trade: 'timmerman' }, { today: TODAY }).eligible).toBe(true);
    expect(scoreMatch({ ...daan, trade: 'betontimmerman' }, { ...almerePoort, trade: 'sloper' }, { today: TODAY }).eligible).toBe(false);
  });

  it('straft ontbrekende certificaten en telt niet-geverifieerde deels mee', () => {
    const none = scoreMatch({ ...daan, certificates: [] }, almerePoort, { today: TODAY });
    const claimed = scoreMatch({ ...daan, certificates: [{ type: 'vca_basis', verified: false }] }, almerePoort, { today: TODAY });
    const verified = scoreMatch(daan, almerePoort, { today: TODAY });
    expect(none.score).toBeLessThan(claimed.score);
    expect(claimed.score).toBeLessThan(verified.score);
    expect(none.reasons.find((r) => r.key === 'certificates')!.label).toMatch(/Ontbreekt: VCA Basis/);
  });

  it('accepteert VCA VOL waar VCA Basis gevraagd is en negeert verlopen certificaten', () => {
    const vol = scoreMatch({ ...daan, certificates: [{ type: 'vca_vol', verified: true }] }, almerePoort, { today: TODAY });
    expect(vol.reasons.find((r) => r.key === 'certificates')!.positive).toBe(true);
    const old = scoreMatch({ ...daan, certificates: [{ type: 'vca_basis', verified: true, expiresAt: '2026-01-01' }] }, almerePoort, { today: TODAY });
    expect(old.reasons.find((r) => r.key === 'certificates')!.label).toMatch(/Ontbreekt/);
  });

  it('weegt beschikbaarheid ten opzichte van de startdatum', () => {
    const late = scoreMatch({ ...daan, availableFrom: '2026-11-01' }, almerePoort, { today: TODAY });
    expect(late.score).toBeLessThan(scoreMatch(daan, almerePoort, { today: TODAY }).score);
    expect(late.reasons.find((r) => r.key === 'availability')!.label).toMatch(/Pas beschikbaar/);
  });

  it('vergelijkt tarief met de indicatie', () => {
    const pricey = scoreMatch({ ...daan, hourlyRateMin: 60 }, almerePoort, { today: TODAY });
    expect(pricey.reasons.find((r) => r.key === 'rate')!.positive).toBe(false);
    expect(scoreMatch({ ...daan, hourlyRateMin: null }, almerePoort, { today: TODAY }).reasons.find((r) => r.key === 'rate')!.label).toBe('Tarief in overleg');
  });

  it('geeft een bonus voor een eerdere inzet bij hetzelfde bedrijf', () => {
    const base = scoreMatch(daan, almerePoort, { today: TODAY }).score;
    const again = scoreMatch({ ...daan, workedForCompanyIds: ['vandijk'] }, almerePoort, { today: TODAY });
    expect(again.score).toBeGreaterThanOrEqual(base);
    expect(again.reasons.some((r) => r.key === 'talentpool')).toBe(true);
  });

  it('blijft binnen 0–100 en respecteert aangepaste gewichten', () => {
    const r = scoreMatch(daan, almerePoort, { today: TODAY, weights: { distance: 40, specialism: 0 } });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.reasons.find((x) => x.key === 'specialism')!.points).toBe(0);
  });
});

describe('rangschikken', () => {
  const youssef: ProfessionalFacts = { ...daan, id: 'youssef', trade: 'betontimmerman', specialisms: ['betontimmerwerk'], location: { lat: 52.5185, lng: 5.4714 }, yearsExperience: 11 };
  const sanne: ProfessionalFacts = { ...daan, id: 'sanne', yearsExperience: 2, certificates: [], location: { lat: 52.3874, lng: 4.6462 }, maxTravelKm: 80 };
  const utrechtGarage: ProjectFacts = { ...almerePoort, id: 'p2', trade: 'betontimmerman', specialisms: ['betontimmerwerk'], location: UTRECHT, requiredCertificates: ['vca_vol'], minYearsExperience: 5 };

  it('zet de beste kandidaat bovenaan en laat ongeschikte weg', () => {
    const ranked = rankProfessionals(almerePoort, [sanne, youssef, daan], { today: TODAY });
    expect(ranked.map((r) => r.pro.id)).toEqual(['daan', 'sanne']);
    expect(ranked[0]!.match.score).toBeGreaterThan(ranked[1]!.match.score);
  });

  it('werkt symmetrisch voor projecten per vakman', () => {
    const ranked = rankProjects(youssef, [almerePoort, utrechtGarage], { today: TODAY });
    expect(ranked.map((r) => r.project.id)).toEqual(['p2']);
  });
});
