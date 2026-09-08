import { describe, expect, it } from 'vitest';
import { parseBrief } from './brief';

describe('parseBrief', () => {
  it('haalt aantal, plaats, start, duur, ervaring en contractvorm uit één zin', () => {
    const r = parseBrief('Ik zoek 4 timmermannen in Almere voor 12 weken, minimaal 3 jaar ervaring, start 21 september, zzp of loondienst.', '2026-09-08');
    expect(r.headcount).toBe(4);
    expect(r.city).toBe('Almere');
    expect(r.startDate).toBe('2026-09-21');
    expect(r.endDate).toBe('2026-12-14');
    expect(r.minYearsExperience).toBe(3);
    expect(r.contractType).toBe('either');
    expect(r.title).toContain('Almere');
  });

  it('begrijpt woorden als getallen en "volgende week"', () => {
    const r = parseBrief('Vanaf volgende week drie betontimmermannen nodig in Utrecht, 45 uur per week', '2026-09-08');
    expect(r.headcount).toBe(3);
    expect(r.city).toBe('Utrecht');
    expect(r.startDate).toBe('2026-09-15');
    expect(r.hoursPerWeek).toBe(45);
    expect(r.specialisms).toContain('betontimmerwerk');
    expect(r.title).toMatch(/^Betontimmerman/);
  });

  it('schuift een startdatum die al voorbij is naar volgend jaar', () => {
    expect(parseBrief('start 1 januari in Zwolle', '2026-09-08').startDate).toBe('2027-01-01');
  });

  it('geeft niets terug voor tekst zonder herkenbare feiten', () => {
    expect(parseBrief('Hallo', '2026-09-08')).toEqual({});
  });
});
