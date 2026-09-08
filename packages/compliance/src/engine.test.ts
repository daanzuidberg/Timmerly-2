import { describe, expect, it } from 'vitest';
import { evaluateCompliance, screenProject } from './engine';
import { RULESET_2026_09 } from './ruleset';

const allSelf = Object.fromEntries(RULESET_2026_09.factors.map((f) => [f.id, f.options[2]!.value]));
const allEmployee = Object.fromEntries(RULESET_2026_09.factors.map((f) => [f.id, f.options[0]!.value]));

describe('compliancecheck', () => {
  it('classificeert volledige zelfstandigheid als laag risico', () => {
    const r = evaluateCompliance(allSelf);
    expect(r.riskLevel).toBe('low');
    expect(r.percentage).toBe(100);
    expect(r.unanswered).toEqual([]);
    expect(r.disclaimer).toMatch(/geen juridisch advies/);
  });

  it('classificeert volledig dienstverband als hoog risico met risicosignalen eerst', () => {
    const r = evaluateCompliance(allEmployee);
    expect(r.riskLevel).toBe('high');
    expect(r.signals[0]!.level).toBe('risk');
    expect(r.signals.every((s) => s.level === 'risk')).toBe(true);
  });

  it('weegt gezag en inbedding dubbel en verhoogt naar “aandacht” als een zware factor rood is', () => {
    const r = evaluateCompliance({ ...allSelf, gezag: 'daily' });
    expect(r.riskLevel).toBe('attention');
    expect(r.signals.find((s) => s.factor === 'gezag')!.level).toBe('risk');
    // Eén lichte factor rood laat "laag" intact.
    expect(evaluateCompliance({ ...allSelf, betaling: 'wage' }).riskLevel).toBe('low');
  });

  it('behandelt onbeantwoorde vragen als grensgeval en markeert de uitkomst als voorlopig', () => {
    const r = evaluateCompliance({ gezag: 'self' });
    expect(r.unanswered.length).toBe(RULESET_2026_09.factors.length - 1);
    expect(r.riskLevel).not.toBe('low');
    expect(r.explanation).toMatch(/Voorlopige uitkomst/);
  });

  it('legt de regelsetversie vast in de uitkomst', () => {
    expect(evaluateCompliance(allSelf).rulesetVersion).toBe('2026-09');
    expect(() => evaluateCompliance(allSelf, '1999-01')).toThrow(/Onbekende regelsetversie/);
  });
});

describe('projectscreening', () => {
  it('signaleert doorlopende fulltime zzp-inzet en vacaturetaal', () => {
    const hints = screenProject({ contractType: 'zzp', hoursPerWeek: 40, startDate: '2026-09-01', endDate: null, requiresOwnTools: false, description: 'Je werkt onder leiding van onze uitvoerder, uitzicht op vast.' });
    expect(hints.length).toBeGreaterThanOrEqual(3);
    expect(hints.join(' ')).toMatch(/einddatum/);
    expect(hints.join(' ')).toMatch(/loondienst/);
  });

  it('zwijgt bij loondienst', () => {
    expect(screenProject({ contractType: 'employment', hoursPerWeek: 40, startDate: '2026-09-01', endDate: null, requiresOwnTools: false, description: '' })).toEqual([]);
  });
});
