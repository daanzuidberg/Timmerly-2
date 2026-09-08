import { CURRENT_RULESET_VERSION, RULESETS, type RiskLevel, type Ruleset } from './ruleset';

export interface ComplianceSignal {
  factor: string;
  label: string;
  level: 'positive' | 'attention' | 'risk';
  text: string;
}

export interface ComplianceResult {
  rulesetVersion: string;
  score: number;
  maxScore: number;
  /** 0–100 */
  percentage: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  explanation: string;
  signals: ComplianceSignal[];
  /** Factoren zonder antwoord; de uitkomst is dan voorlopig. */
  unanswered: string[];
  disclaimer: string;
}

export const RISK_LABELS: Record<RiskLevel, string> = { low: 'Laag risico', attention: 'Aandacht vereist', high: 'Hoog risico' };

const RISK_EXPLANATIONS: Record<RiskLevel, string> = {
  low: 'De samenwerking heeft overwegend kenmerken van zelfstandig ondernemerschap. Leg de afspraken vast en werk er ook zo.',
  attention: 'Enkele kenmerken wijzen richting een arbeidsovereenkomst. Bespreek de aandachtspunten en leg ze scherper vast voordat de opdracht start.',
  high: 'Deze inzet lijkt sterk op werken in dienstverband. Bespreek een andere contractvorm (bijvoorbeeld loondienst of uitzenden) of pas de samenwerking wezenlijk aan.'
};

/**
 * Beoordeelt antwoorden tegen een regelset. Onbeantwoorde factoren tellen als
 * grensgeval (1 punt) en worden apart gemeld, zodat een half ingevulde check
 * nooit ten onrechte "laag risico" oplevert.
 */
export function evaluateCompliance(answers: Record<string, string | undefined>, rulesetVersion: string = CURRENT_RULESET_VERSION): ComplianceResult {
  const ruleset = getRuleset(rulesetVersion);
  let score = 0;
  let maxScore = 0;
  const signals: ComplianceSignal[] = [];
  const unanswered: string[] = [];

  for (const factor of ruleset.factors) {
    maxScore += 2 * factor.weight;
    const option = factor.options.find((o) => o.value === answers[factor.id]);
    if (!option) {
      unanswered.push(factor.id);
      score += 1 * factor.weight;
      continue;
    }
    score += option.points * factor.weight;
    signals.push({
      factor: factor.id,
      label: factor.label,
      level: option.points === 2 ? 'positive' : option.points === 1 ? 'attention' : 'risk',
      text:
        option.points === 2
          ? `${factor.label}: wijst op zelfstandigheid (${option.label.toLowerCase()}).`
          : option.points === 1
            ? `${factor.label}: aandachtspunt — leg dit vast in de overeenkomst (${option.label.toLowerCase()}).`
            : `${factor.label}: risicofactor — ${option.label.toLowerCase()}.`
    });
  }

  const percentage = Math.round((score / maxScore) * 100);
  const ratio = score / maxScore;
  const riskLevel: RiskLevel = ratio >= ruleset.thresholds.low ? 'low' : ratio >= ruleset.thresholds.attention ? 'attention' : 'high';

  // Gezag of inbedding op 'risico' is op zichzelf reden voor minstens 'aandacht'.
  const heavyRisk = signals.some((s) => s.level === 'risk' && ruleset.factors.find((f) => f.id === s.factor)?.weight === 2);
  const finalLevel: RiskLevel = riskLevel === 'low' && heavyRisk ? 'attention' : riskLevel;

  // Risico's eerst, dan aandachtspunten: dat is wat de gebruiker moet oplossen.
  const order = { risk: 0, attention: 1, positive: 2 };
  signals.sort((a, b) => order[a.level] - order[b.level]);

  return {
    rulesetVersion: ruleset.version,
    score,
    maxScore,
    percentage,
    riskLevel: finalLevel,
    riskLabel: RISK_LABELS[finalLevel],
    explanation: unanswered.length ? `Voorlopige uitkomst: ${unanswered.length} vraag${unanswered.length === 1 ? '' : 'en'} nog niet beantwoord. ` + RISK_EXPLANATIONS[finalLevel] : RISK_EXPLANATIONS[finalLevel],
    signals,
    unanswered,
    disclaimer: ruleset.disclaimer
  };
}

export function getRuleset(version: string = CURRENT_RULESET_VERSION): Ruleset {
  const rs = RULESETS[version];
  if (!rs) throw new Error(`Onbekende regelsetversie: ${version}`);
  return rs;
}

/**
 * Snelle signalering op een projectomschrijving/aanmelding, zonder vragenlijst:
 * gebruikt door de "AI Compliance Assistant" om een opdrachtgever te wijzen op
 * kenmerken die extra aandacht vragen. Geeft alleen signalen, geen oordeel.
 */
export function screenProject(project: { contractType: string; hoursPerWeek: number; endDate?: string | null; startDate: string; requiresOwnTools: boolean; description: string }): string[] {
  const hints: string[] = [];
  if (project.contractType === 'employment') return hints;
  const months = project.endDate ? monthsBetween(project.startDate, project.endDate) : null;
  if (months === null) hints.push('Geen einddatum: een doorlopende inzet van een zzp’er lijkt eerder op een dienstverband. Overweeg een einddatum of resultaat.');
  else if (months > 12 && project.hoursPerWeek >= 32) hints.push('Langer dan een jaar en (bijna) fulltime: leg vast waarom dit een zelfstandige opdracht is.');
  if (!project.requiresOwnTools) hints.push('Gereedschap wordt door de opdrachtgever geleverd: eigen gereedschap weegt mee als teken van ondernemerschap.');
  const text = project.description.toLowerCase();
  if (/onder (leiding|toezicht)|aansturing|meewerkend in (ons|het) team|inplannen|werkrooster/.test(text)) hints.push('De omschrijving noemt aansturing of inplannen in het team: dat wijst op gezag en inbedding.');
  if (/vast(e)? (dienst|baan)|uitzicht op vast|salaris/.test(text)) hints.push('De omschrijving lijkt op een vacature voor loondienst; overweeg de contractvorm “loondienst” of “beide”.');
  return hints;
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by! - ay!) * 12 + (bm! - am!);
}
