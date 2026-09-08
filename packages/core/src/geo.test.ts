import { describe, expect, it } from 'vitest';
import { coarsen, distanceKm, geocode } from './geo';

describe('geo', () => {
  it('meet Kampen–Almere op ongeveer 50 km', () => {
    const km = distanceKm(geocode('Kampen')!, geocode('Almere')!);
    expect(km).toBeGreaterThan(45);
    expect(km).toBeLessThan(55);
  });

  it('geeft nul afstand voor hetzelfde punt', () => {
    expect(distanceKm({ lat: 52, lng: 5 }, { lat: 52, lng: 5 })).toBe(0);
  });

  it('vergrooft coördinaten tot een raster (locatieprivacy)', () => {
    const c = coarsen({ lat: 52.5550, lng: 5.9114 });
    expect(c.lat).toBeCloseTo(52.56, 5);
    expect(c.lng).toBeCloseTo(5.92, 5);
  });

  it('is niet hoofdlettergevoelig en kent alternatieve namen', () => {
    expect(geocode("'s-Hertogenbosch")).toEqual(geocode('Den Bosch'));
    expect(geocode('Onbekend')).toBeNull();
  });
});
