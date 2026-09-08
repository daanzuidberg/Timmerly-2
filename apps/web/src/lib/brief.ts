/**
 * Zet een vrije projectbeschrijving ("Ik zoek 4 timmermannen in Almere voor
 * 12 weken, minimaal 3 jaar ervaring, start 21 september") om naar
 * formulierwaarden. Regelgebaseerd, dus voorspelbaar en zonder externe API;
 * een taalmodel kan dit later verrijken via dezelfde interface.
 */
import { PLACE_COORDS, SPECIALISMS, SPECIALISM_LABELS, addDays, todayIso } from '@timmerly/core';

export interface ParsedBrief {
  headcount?: number; city?: string; startDate?: string; endDate?: string; minYearsExperience?: number; specialisms?: string[]; contractType?: 'zzp' | 'employment' | 'either'; title?: string; hoursPerWeek?: number;
}

const MONTHS: Record<string, number> = { januari: 1, jan: 1, februari: 2, feb: 2, maart: 3, mrt: 3, april: 4, apr: 4, mei: 5, juni: 6, jun: 6, juli: 7, jul: 7, augustus: 8, aug: 8, september: 9, sept: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11, december: 12, dec: 12 };
const WORDS: Record<string, number> = { een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10 };

export function parseBrief(text: string, today = todayIso()): ParsedBrief {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  const out: ParsedBrief = {};
  const num = (s: string) => WORDS[s] ?? Number(s);

  const head = /(\d+|een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien)\s+(timmerm|vakm|man|mensen|betontimmer|steltimmer|afbouwtimmer|mutatietimmer)/.exec(t);
  if (head) out.headcount = num(head[1]!);

  for (const city of Object.keys(PLACE_COORDS).sort((a, b) => b.length - a.length)) if (new RegExp(`\\b(in|te|bij|rond|regio|omgeving)\\s+${city}\\b`).test(t) || new RegExp(`\\b${city}\\b`).test(t)) { out.city = city.replace(/\b\w/g, (c) => c.toUpperCase()); break; }

  const start = /(start(?:end)?|vanaf|begin(?:t|nend)?)\s*(?:op|per|in)?\s*(\d{1,2})\s+([a-z]+)/.exec(t);
  if (start && MONTHS[start[3]!]) { const y = Number(today.slice(0, 4)); const iso = `${y}-${String(MONTHS[start[3]!]).padStart(2, '0')}-${String(start[2]).padStart(2, '0')}`; out.startDate = iso < today ? `${y + 1}${iso.slice(4)}` : iso; }
  else if (/per direct|z\.?s\.?m\.?|zo snel mogelijk|meteen/.test(t)) out.startDate = addDays(today, 3);
  else if (/volgende week|maandag/.test(t)) out.startDate = addDays(today, 7);

  const dur = /(\d+)\s*(weken|week|maanden|maand)/.exec(t);
  if (dur && (out.startDate || true)) { const n = Number(dur[1]); const days = dur[2]!.startsWith('we') ? n * 7 : n * 30; out.endDate = addDays(out.startDate ?? today, days); }

  const exp = /(?:minimaal|min\.?|tenminste|ten minste)\s*(\d+)\s*jaar/.exec(t) ?? /(\d+)\s*\+?\s*jaar\s*ervaring/.exec(t);
  if (exp) out.minYearsExperience = Number(exp[1]);

  const hours = /(\d{2})\s*(?:uur|u)\s*(?:per|p\/|\/)\s*week/.exec(t);
  if (hours) out.hoursPerWeek = Number(hours[1]);

  const specs = SPECIALISMS.filter((s) => t.includes(SPECIALISM_LABELS[s].toLowerCase()) || t.includes(s.replace(/_/g, ' ')));
  if (/betontimmer|bekisting/.test(t)) specs.push('betontimmerwerk');
  if (/aftimmer/.test(t) && !specs.includes('aftimmering')) specs.push('aftimmering');
  if (/nieuwbouw/.test(t) && !specs.includes('nieuwbouw')) specs.push('nieuwbouw');
  if (specs.length) out.specialisms = [...new Set(specs)];

  if (/\bzzp\b/.test(t) && /loondienst|beide|of\s+vast/.test(t)) out.contractType = 'either';
  else if (/\bzzp\b/.test(t)) out.contractType = 'zzp';
  else if (/loondienst|in dienst|vast contract/.test(t)) out.contractType = 'employment';

  const kind = /betontimmer/.test(t) ? 'Betontimmerman' : /steltimmer/.test(t) ? 'Steltimmerman' : /mutatie/.test(t) ? 'Mutatietimmerman' : /afbouw/.test(t) ? 'Afbouwtimmerman' : 'Timmerman';
  if (out.city || out.specialisms) out.title = `${kind}${out.headcount && out.headcount > 1 ? 'nen' : ''} ${out.specialisms?.[0] ? SPECIALISM_LABELS[out.specialisms[0] as keyof typeof SPECIALISM_LABELS].toLowerCase() : ''}${out.city ? ` – ${out.city}` : ''}`.replace(/\s+/g, ' ').trim();
  return out;
}
