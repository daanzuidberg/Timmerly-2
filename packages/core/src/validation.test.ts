import { describe, expect, it } from 'vitest';
import { kvkSchema, passwordSchema, phoneSchema, projectSchema, btwSchema } from './validation';

describe('validatie', () => {
  it('eist 12 tekens met letters en cijfers voor een wachtwoord', () => {
    expect(passwordSchema.safeParse('kort1').success).toBe(false);
    expect(passwordSchema.safeParse('alleenletters!!!').success).toBe(false);
    expect(passwordSchema.safeParse('timmerman-2026-ok').success).toBe(true);
  });

  it('accepteert Nederlandse telefoonnummers in gangbare notaties', () => {
    for (const ok of [
      '06 12345678', '0612345678', '+31612345678', '038 1234567', '088-1234567', '088 1234567', '+31 88 1234567', '(088) 123 45 67',
      '0800-1234', '0800 1234567', '0900-1234', '0900-1234567'
    ]) {
      expect(phoneSchema.safeParse(ok).success, ok).toBe(true);
    }
    for (const bad of ['12345', '+49 170 1234567', '06-1234', '0800-12', '0900-12345678']) expect(phoneSchema.safeParse(bad).success, bad).toBe(false);
  });

  it('valideert KvK- en BTW-formaat', () => {
    expect(kvkSchema.safeParse('12345678').success).toBe(true);
    expect(kvkSchema.safeParse('1234567').success).toBe(false);
    expect(btwSchema.safeParse('nl001234567b01').success).toBe(true);
    expect(btwSchema.safeParse('NL0012B01').success).toBe(false);
  });

  it('wijst een tariefrange af waarvan min > max en een einddatum voor de start', () => {
    const base = {
      title: 'Aftimmering 84 woningen', description: 'Aftimmering van 84 grondgebonden woningen in ploegen van vier.',
      trade: 'timmerman', specialisms: ['aftimmering'], city: 'Almere', startDate: '2026-09-21', headcount: 4,
      hoursPerWeek: 40, contractType: 'either'
    };
    expect(projectSchema.safeParse({ ...base, rateMin: 50, rateMax: 45 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, endDate: '2026-09-01' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, rateMin: 45, rateMax: 50, endDate: '2026-12-12' }).success).toBe(true);
  });
});

describe('provincie uit een select', () => {
  it('accepteert een lege keuze als "niet ingevuld"', async () => {
    const { companyProfileSchema } = await import('./validation');
    const r = companyProfileSchema.safeParse({ name: 'Bouw BV', kvkNumber: '12345678', phone: '06 12345678', city: 'Zwolle', province: '' });
    expect(r.success).toBe(true);
    expect(r.success && r.data.province).toBeUndefined();
    expect(companyProfileSchema.safeParse({ name: 'Bouw BV', kvkNumber: '12345678', phone: '06 12345678', city: 'Zwolle', province: 'Mars' }).success).toBe(false);
  });
});
