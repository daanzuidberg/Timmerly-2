/**
 * Regelset voor de ZZP-compliancecheck (beoordeling arbeidsrelatie, Wet DBA).
 *
 * Dit is bewust DATA, geen code: de factoren, antwoordopties, punten en
 * drempels staan in één object met een versienummer. Een wijziging in
 * wet- of rechtspraak (bijv. na het Deliveroo-arrest of het wetsvoorstel
 * Verduidelijking beoordeling arbeidsrelaties) betekent een nieuwe versie van
 * dit object — geen herbouw van het platform. De actieve versie wordt in de
 * settings-tabel beheerd; eerdere uitkomsten bewaren hun eigen versie.
 *
 * De factoren volgen de indicaties die de Belastingdienst en de Hoge Raad
 * hanteren: gezag, inbedding, zelfstandigheid/ondernemerschap, vervanging,
 * risico, meerdere opdrachtgevers, duur, betaling en contractafspraken.
 *
 * Dit is risicosignalering. Het is geen juridisch advies en geen garantie
 * over de kwalificatie van een arbeidsrelatie; partijen blijven zelf
 * verantwoordelijk. Die tekst hoort in elke UI die deze uitkomst toont.
 */

export type RiskLevel = 'low' | 'attention' | 'high';

export interface RuleOption {
  value: string;
  label: string;
  /** 0 = wijst op dienstverband, 1 = grensgeval, 2 = wijst op zelfstandigheid. */
  points: 0 | 1 | 2;
}

export interface RuleFactor {
  id: string;
  label: string;
  question: string;
  help: string;
  /** Sommige factoren wegen zwaarder (gezag en inbedding). */
  weight: number;
  options: readonly RuleOption[];
}

export interface Ruleset {
  version: string;
  effectiveFrom: string;
  title: string;
  factors: readonly RuleFactor[];
  /** Grenswaarden als percentage van de maximale score. */
  thresholds: { low: number; attention: number };
  disclaimer: string;
  sources: readonly string[];
}

export const RULESET_2026_09: Ruleset = {
  version: '2026-09',
  effectiveFrom: '2026-09-01',
  title: 'ZZP Compliance Check',
  thresholds: { low: 0.7, attention: 0.4 },
  disclaimer:
    'Deze check signaleert risico’s in de samenwerking op basis van jullie antwoorden. Het is geen juridisch advies en geen garantie dat de arbeidsrelatie als opdracht of als dienstverband kwalificeert. Opdrachtgever en opdrachtnemer blijven zelf verantwoordelijk voor de juridische beoordeling. Raadpleeg bij twijfel een adviseur of de Belastingdienst.',
  sources: [
    'Belastingdienst – Beoordeling arbeidsrelaties (webmodule en handreiking)',
    'Hoge Raad 24 maart 2023 (Deliveroo): holistische weging van alle omstandigheden',
    'Hoge Raad 21 februari 2025 (Uber): ondernemerschap weegt mee',
    'Wetsvoorstel Verduidelijking beoordeling arbeidsrelaties en rechtsvermoeden (Vbar)'
  ],
  factors: [
    {
      id: 'gezag', label: 'Gezagsverhouding', weight: 2,
      question: 'Wie bepaalt hoe het werk wordt uitgevoerd?',
      help: 'Instructies over het resultaat zijn normaal bij een opdracht; dagelijkse aansturing over de manier van werken wijst op gezag.',
      options: [
        { value: 'daily', label: 'De opdrachtgever stuurt dagelijks aan', points: 0 },
        { value: 'outline', label: 'Overleg over hoofdlijnen, eigen uitvoering', points: 1 },
        { value: 'self', label: 'De vakman bepaalt zelf hoe het werk gebeurt', points: 2 }
      ]
    },
    {
      id: 'inbedding', label: 'Inbedding in de organisatie', weight: 2,
      question: 'Doet de vakman hetzelfde werk als vaste medewerkers, op dezelfde manier?',
      help: 'Werk dat tot de kernactiviteit van de opdrachtgever behoort en naast eigen personeel wordt gedaan, weegt zwaar richting dienstverband.',
      options: [
        { value: 'identical', label: 'Identiek aan eigen personeel, in hetzelfde team', points: 0 },
        { value: 'partly', label: 'Deels vergelijkbaar, eigen taakgebied', points: 1 },
        { value: 'distinct', label: 'Afgebakende eigen opdracht met eigen resultaat', points: 2 }
      ]
    },
    {
      id: 'vervanging', label: 'Vrije vervanging', weight: 1,
      question: 'Mag de vakman zich laten vervangen door iemand anders?',
      help: 'Persoonlijke arbeidsplicht wijst op een arbeidsovereenkomst.',
      options: [
        { value: 'no', label: 'Nee, persoonlijk verplicht', points: 0 },
        { value: 'consent', label: 'Alleen met toestemming van de opdrachtgever', points: 1 },
        { value: 'free', label: 'Ja, vrij te vervangen door een gekwalificeerde collega', points: 2 }
      ]
    },
    {
      id: 'gereedschap', label: 'Gereedschap en materiaal', weight: 1,
      question: 'Wie levert het gereedschap en het materiaal?',
      help: 'Eigen investeringen in gereedschap en vervoer horen bij ondernemerschap; bouwmateriaal komt in de bouw vrijwel altijd van de opdrachtgever en weegt daarom licht.',
      options: [
        { value: 'client', label: 'De opdrachtgever levert alles, ook handgereedschap', points: 0 },
        { value: 'partly', label: 'Eigen handgereedschap, groot materieel van de opdrachtgever', points: 1 },
        { value: 'own', label: 'Eigen gereedschap, bus en materieel', points: 2 }
      ]
    },
    {
      id: 'risico', label: 'Ondernemersrisico', weight: 1,
      question: 'Wie draagt het risico bij fouten, herstelwerk of stilstand?',
      help: 'Aansprakelijkheid voor het resultaat en een eigen verzekering wijzen op zelfstandigheid.',
      options: [
        { value: 'none', label: 'Geen risico voor de vakman; uren worden altijd betaald', points: 0 },
        { value: 'limited', label: 'Herstelwerk voor eigen rekening', points: 1 },
        { value: 'full', label: 'Aansprakelijk voor het resultaat en zelf verzekerd', points: 2 }
      ]
    },
    {
      id: 'opdrachtgevers', label: 'Meerdere opdrachtgevers', weight: 1,
      question: 'Werkt de vakman ook voor andere opdrachtgevers?',
      help: 'Economische afhankelijkheid van één opdrachtgever is een risicofactor.',
      options: [
        { value: 'single', label: 'Alleen deze opdrachtgever', points: 0 },
        { value: 'few', label: 'Enkele andere opdrachtgevers per jaar', points: 1 },
        { value: 'many', label: 'Meerdere opdrachtgevers, ook gelijktijdig', points: 2 }
      ]
    },
    {
      id: 'duur', label: 'Duur en omvang', weight: 1,
      question: 'Hoe lang en hoeveel uur per week duurt de samenwerking?',
      help: 'Langdurig fulltime voor één opdrachtgever lijkt op een dienstverband, zeker zonder eigen einddatum.',
      options: [
        { value: 'long', label: 'Langer dan een jaar, fulltime, zonder einddatum', points: 0 },
        { value: 'medium', label: 'Enkele maanden, of parttime', points: 1 },
        { value: 'project', label: 'Afgebakend project met een einddatum of resultaat', points: 2 }
      ]
    },
    {
      id: 'betaling', label: 'Betaling', weight: 1,
      question: 'Hoe wordt er betaald?',
      help: 'Facturatie vanuit een eigen onderneming met een zelf bepaald tarief hoort bij ondernemerschap; doorbetaling bij ziekte of verlof niet.',
      options: [
        { value: 'wage', label: 'Vast bedrag per periode, ook bij ziekte of verlof', points: 0 },
        { value: 'hourly', label: 'Uurtarief op factuur, zonder doorbetaling', points: 1 },
        { value: 'result', label: 'Eigen tarief of aanneemsom, factuur per resultaat', points: 2 }
      ]
    },
    {
      id: 'contract', label: 'Contractafspraken', weight: 1,
      question: 'Wat is schriftelijk vastgelegd?',
      help: 'Een overeenkomst van opdracht helpt alleen als de praktijk ermee overeenkomt.',
      options: [
        { value: 'none', label: 'Niets, of alleen een mondelinge afspraak', points: 0 },
        { value: 'basic', label: 'Overeenkomst van opdracht zonder resultaatomschrijving', points: 1 },
        { value: 'full', label: 'Overeenkomst met resultaat, tarief, looptijd en aansprakelijkheid', points: 2 }
      ]
    }
  ]
};

export const RULESETS: Record<string, Ruleset> = { [RULESET_2026_09.version]: RULESET_2026_09 };
export const CURRENT_RULESET_VERSION = RULESET_2026_09.version;
